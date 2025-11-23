import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get incoming calls (status: incoming_call) - para que dispatchers acepten
// Función completamente defensiva para no romper producción
export const getIncomingCalls = query({
  args: {},
  handler: async (ctx) => {
    // Envolver TODO en try-catch para asegurar que nunca falle
    try {
      let incoming: any[] = [];
      
      // Intentar obtener incidentes de forma segura
      try {
        // Primero intentar con índice
        try {
          incoming = await ctx.db
            .query("incidents")
            .withIndex("by_status", (q) => q.eq("status", "incoming_call"))
            .collect();
        } catch (indexError) {
          // Si falla el índice, intentar query directa
          try {
            const allIncidents = await ctx.db.query("incidents").collect();
            incoming = allIncidents.filter((inc) => {
              try {
                return inc && inc.status === "incoming_call";
              } catch {
                return false;
              }
            });
          } catch (queryError) {
            // Si también falla la query directa, retornar vacío
            console.warn("Both index and direct query failed:", queryError);
            return [];
          }
        }
      } catch (outerError) {
        // Si cualquier cosa falla, retornar vacío
        console.warn("Failed to query incidents:", outerError);
        return [];
      }

      // Si no hay incidentes, retornar vacío
      if (!incoming || incoming.length === 0) {
        return [];
      }

      // Procesar cada incidente de forma completamente segura
      const results: any[] = [];
      
      for (const incident of incoming) {
        try {
          // Validar que el incidente tenga estructura básica
          if (!incident || typeof incident !== "object" || !incident._id) {
            continue;
          }

          // Obtener dispatcher de forma segura
          let dispatcher = null;
          if (incident.dispatcherId) {
            try {
              dispatcher = await ctx.db.get(incident.dispatcherId);
            } catch (err) {
              // Dispatcher no existe o hay error, continuar sin él
            }
          }

          // Obtener patient de forma segura
          let patient = null;
          if (incident.patientId) {
            try {
              patient = await ctx.db.get(incident.patientId);
            } catch (err) {
              // Patient no existe o hay error, continuar sin él
            }
          }
          
          // Obtener call de forma segura
          let call = null;
          if (incident._id) {
            try {
              call = await ctx.db
                .query("calls")
                .withIndex("by_incident", (q) => q.eq("incidentId", incident._id))
                .first();
            } catch (err) {
              // Call no existe o hay error, continuar sin él
            }
          }

          // Agregar incidente a resultados (incluso sin dispatcher/patient/call)
          results.push({
            ...incident,
            dispatcher,
            patient,
            call,
          });
        } catch (incidentError) {
          // Si hay error procesando un incidente individual, omitirlo y continuar
          console.warn("Error processing incident, skipping:", incident?._id, incidentError);
          continue;
        }
      }

      return results;
    } catch (error) {
      // Capturar CUALQUIER error inesperado y retornar array vacío
      console.error("Unexpected error in getIncomingCalls, returning empty array:", error);
      return [];
    }
  },
});

// Get active incidents (confirmed, rescuer_assigned, in_progress) - incidentes en progreso
export const getActiveIncidents = query({
  args: {},
  handler: async (ctx) => {
    try {
      const activeStatuses = ["confirmed", "rescuer_assigned", "in_progress"] as const;
      
      // Usar índices para cada status y combinar resultados
      let activeIncidents: any[] = [];
      for (const status of activeStatuses) {
        try {
          const incidentsByStatus = await ctx.db
            .query("incidents")
            .withIndex("by_status", (q) => q.eq("status", status))
            .collect();
          
          // Filtrar solo los que tienen dispatcherId válido
          activeIncidents.push(...incidentsByStatus.filter((inc) => inc.dispatcherId));
        } catch (indexError) {
          console.warn(`Error querying by_status index for ${status}:`, indexError);
          // Continuar con el siguiente status
        }
      }

      // Si no encontramos nada con índices, intentar fallback (solo si es necesario)
      if (activeIncidents.length === 0) {
        try {
          const allIncidents = await ctx.db.query("incidents").collect();
          activeIncidents = allIncidents.filter(
            (inc) =>
              activeStatuses.includes(inc.status as typeof activeStatuses[number]) &&
              inc.dispatcherId
          );
        } catch (fallbackError) {
          console.error("Fallback query also failed:", fallbackError);
          return [];
        }
      }

      const incidentsWithData = await Promise.all(
        activeIncidents.map(async (incident) => {
          try {
            // Validar que el incidente tenga dispatcherId antes de continuar
            if (!incident.dispatcherId) {
              return null;
            }

            const dispatcher = await ctx.db.get(incident.dispatcherId).catch(() => null);
            const patient = incident.patientId
              ? await ctx.db.get(incident.patientId).catch(() => null)
              : null;
            
            // Manejar calls de forma segura
            let call = null;
            try {
              call = await ctx.db
                .query("calls")
                .withIndex("by_incident", (q) => q.eq("incidentId", incident._id))
                .first();
            } catch (error) {
              console.warn("Error reading call for incident:", incident._id, error);
            }

            return {
              ...incident,
              dispatcher,
              patient,
              call,
            };
          } catch (error) {
            console.warn("Error processing incident:", incident._id, error);
            return null;
          }
        })
      );

      return incidentsWithData.filter((inc) => inc !== null);
    } catch (error) {
      console.error("Error in getActiveIncidents:", error);
      return [];
    }
  },
});

// Alias for the Python backend which expects "create" (como en main)
// This will be defined after createOrUpdate

// Get incident by ID (alias for backend compatibility)
export const get = query({
  args: { id: v.id("incidents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List recent incidents (alias for backend compatibility)
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const allIncidents = await ctx.db.query("incidents").collect();

    const recentStatuses = ["completed", "cancelled"] as const;
    const recentFiltered = allIncidents
      .filter(
        (inc) =>
          recentStatuses.includes(inc.status as typeof recentStatuses[number]) &&
          inc.dispatcherId
      )
      .slice(0, limit);

    return recentFiltered;
  },
});

// Get a single incident with all related data
export const getIncident = query({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, args) => {
    try {
      const incident = await ctx.db.get(args.incidentId);
      if (!incident) return null;

      const dispatcher = incident.dispatcherId
        ? await ctx.db.get(incident.dispatcherId)
        : null;
      const patient = incident.patientId
        ? await ctx.db.get(incident.patientId)
        : null;

      // Get call/transcription data (manejar errores de schema mismatch)
      let call = null;
      try {
        call = await ctx.db
          .query("calls")
          .withIndex("by_incident", (q) => q.eq("incidentId", args.incidentId))
          .first();
      } catch (error) {
        console.warn("Error reading call for incident:", args.incidentId, error);
      }

      // Get incident assignment if exists
      let assignment = null;
      try {
        assignment = await ctx.db
          .query("incidentAssignments")
          .withIndex("by_incident", (q) => q.eq("incidentId", args.incidentId))
          .first();
      } catch (error) {
        console.warn("Error reading assignment for incident:", args.incidentId, error);
      }

      return {
        ...incident,
        dispatcher,
        patient,
        call,
        assignment,
      };
    } catch (error) {
      console.error("Error in getIncident:", error);
      return null;
    }
  },
});

// Get recent incidents (completed, cancelled) for history
export const getRecentIncidents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    try {
      const limit = args.limit ?? 20;
      const recentStatuses = ["completed", "cancelled"] as const;
      
      // Usar índices para cada status y combinar resultados
      let recentIncidents: any[] = [];
      for (const status of recentStatuses) {
        try {
          const incidentsByStatus = await ctx.db
            .query("incidents")
            .withIndex("by_status", (q) => q.eq("status", status))
            .collect();
          
          // Filtrar solo los que tienen dispatcherId válido
          recentIncidents.push(...incidentsByStatus.filter((inc) => inc.dispatcherId));
        } catch (indexError) {
          console.warn(`Error querying by_status index for ${status}:`, indexError);
          // Continuar con el siguiente status
        }
      }

      // Si no encontramos nada con índices, intentar fallback (solo si es necesario)
      if (recentIncidents.length === 0) {
        try {
          const allIncidents = await ctx.db.query("incidents").collect();
          recentIncidents = allIncidents.filter(
            (inc) =>
              recentStatuses.includes(inc.status as typeof recentStatuses[number]) &&
              inc.dispatcherId
          );
        } catch (fallbackError) {
          console.error("Fallback query also failed:", fallbackError);
          return [];
        }
      }

      // Limitar y ordenar (más recientes primero, asumiendo que lastUpdated existe)
      const recentFiltered = recentIncidents
        .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))
        .slice(0, limit);

      const recentWithData = await Promise.all(
        recentFiltered.map(async (incident) => {
          try {
            // Validar que el incidente tenga dispatcherId antes de continuar
            if (!incident.dispatcherId) {
              return null;
            }

            const dispatcher = await ctx.db.get(incident.dispatcherId).catch(() => null);
            const patient = incident.patientId
              ? await ctx.db.get(incident.patientId).catch(() => null)
              : null;
          
            // Manejar calls de forma segura
            let call = null;
            try {
              call = await ctx.db
                .query("calls")
                .withIndex("by_incident", (q) => q.eq("incidentId", incident._id))
                .first();
            } catch (error) {
              console.warn("Error reading call for incident:", incident._id, error);
            }

            return {
              ...incident,
              dispatcher,
              patient,
              call,
            };
          } catch (error) {
            console.warn("Error processing incident:", incident._id, error);
            return null;
          }
        })
      );

      return recentWithData.filter((inc) => inc !== null);
    } catch (error) {
      console.error("Error in getRecentIncidents:", error);
      return [];
    }
  },
});

// Mutation: Dispatcher acepta una llamada entrante
export const acceptCall = mutation({
  args: {
    incidentId: v.id("incidents"),
    dispatcherId: v.id("dispatchers"),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      throw new Error("Incident not found");
    }

    if (incident.status !== "incoming_call") {
      throw new Error("Incident is not in incoming_call status");
    }

    // Actualizar incidente: asignar dispatcher (puede ser diferente al inicial) y cambiar status
    await ctx.db.patch(args.incidentId, {
      dispatcherId: args.dispatcherId, // Actualizar al dispatcher que acepta
      status: "confirmed",
      lastUpdated: Date.now(),
    });

    // Nota: En schema de main, calls no tiene status, solo transcriptionChunks

    return { success: true, incidentId: args.incidentId };
  },
});

// Mutation: Confirmar emergencia (crea IncidentAssignment)
export const confirmEmergency = mutation({
  args: {
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      throw new Error("Incident not found");
    }

    if (incident.status !== "confirmed") {
      throw new Error("Incident must be confirmed before creating assignment");
    }

    // Verificar si ya existe un assignment para este incidente
    const existing = await ctx.db
      .query("incidentAssignments")
      .withIndex("by_incident", (q) => q.eq("incidentId", args.incidentId))
      .first();

    if (existing) {
      return { success: true, assignmentId: existing._id };
    }

    // Crear IncidentAssignment en estado pending sin rescuerId
    // Esto hace que la emergencia aparezca disponible para todos los rescatistas
    // El rescuerId se asignará cuando un rescatista acepte la emergencia
    // Schema permite rescuerId opcional
    const assignmentId = await ctx.db.insert("incidentAssignments", {
      incidentId: args.incidentId,
      status: "pending",
      times: {
        offered: Date.now(),
      },
    });

    return { success: true, assignmentId };
  },
});

// Create or update incident (called by backend during real-time updates)
// El backend envía campos planos que necesitamos mapear a nuestro schema
export const createOrUpdate = mutation({
  args: {
    // Required (como en main)
    callSessionId: v.string(),
    dispatcherId: v.id("dispatchers"),
    
    // Priority
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    
    // Patient info (campos planos del backend)
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    patientAge: v.optional(v.float64()),
    patientSex: v.optional(v.union(v.literal("M"), v.literal("F"))),
    
    // Medical status
    consciousness: v.optional(v.string()),
    breathing: v.optional(v.string()),
    avdi: v.optional(v.string()),
    respiratoryStatus: v.optional(v.string()),
    
    // Medical details
    symptomOnset: v.optional(v.string()),
    medicalHistory: v.optional(v.string()),
    currentMedications: v.optional(v.string()),
    allergies: v.optional(v.string()),
    vitalSigns: v.optional(v.string()),
    
    // Location (campos planos del backend)
    address: v.optional(v.string()),
    district: v.optional(v.string()),
    reference: v.optional(v.string()),
    apartment: v.optional(v.string()),
    
    // Resources
    requiredRescuers: v.optional(v.string()), // Schema expects string, backend may send number - convert if needed
    requiredResources: v.optional(v.string()),
    
    // Administrative
    healthInsurance: v.optional(v.string()),
    conciergeNotified: v.optional(v.string()),
    
    // Incident info
    incidentType: v.optional(v.string()),
    description: v.optional(v.string()),
    
    // Complete data
    fullTranscript: v.optional(v.string()),
    rawCanonicalData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { callSessionId, dispatcherId, ...updateData } = args;
    
    // Try to find existing incident by session ID (como en main)
    const existing = await ctx.db
      .query("incidents")
      .withIndex("by_session", (q) => q.eq("callSessionId", callSessionId))
      .first();
    
    // Preparar datos para insert/update, asegurando que requiredRescuers sea string si viene como number
    const dataToSave = {
      ...updateData,
      lastUpdated: Date.now(),
    };
    
    if (existing) {
      // UPDATE existing incident
      await ctx.db.patch(existing._id, dataToSave);
      return existing._id;
    } else {
      // CREATE new incident (first chunk of call)
      const incidentId = await ctx.db.insert("incidents", {
        callSessionId,
        dispatcherId,
        status: "incoming_call",
        priority: args.priority || "medium",
        address: args.address || "Unknown",
        ...dataToSave,
      });
      return incidentId;
    }
  },
});

// Alias for the Python backend which expects "create" (como en main)
export const create = createOrUpdate;

// Mutation: Finalizar llamada (End Call)
export const endCall = mutation({
  args: {
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      throw new Error("Incident not found");
    }

    // Cambiar status a completed
    await ctx.db.patch(args.incidentId, {
      status: "completed",
      lastUpdated: Date.now(),
    });

    return { success: true, incidentId: args.incidentId };
  },
});

// TEMPORAL: Limpia incidentes sin dispatcherId (solo desarrollo)
export const fixOrphanedIncidents = mutation({
  handler: async (ctx) => {
    const allIncidents = await ctx.db.query("incidents").collect();
    const dispatchers = await ctx.db.query("dispatchers").collect();
    
    if (dispatchers.length === 0) {
      throw new Error("No dispatchers found. Please seed dispatchers first.");
    }

    const firstDispatcher = dispatchers[0];
    let fixed = 0;
    let deleted = 0;

    for (const incident of allIncidents) {
      // Verificar si tiene dispatcherId (puede haber datos antiguos sin dispatcherId)
      // Usamos type assertion porque TypeScript dice que es requerido pero puede haber datos antiguos
      if (!(incident as { dispatcherId?: string }).dispatcherId) {
        if (incident.status === "incoming_call" && firstDispatcher) {
          await ctx.db.patch(incident._id, {
            dispatcherId: firstDispatcher._id,
          });
          fixed++;
        } else {
          await ctx.db.delete(incident._id);
          deleted++;
        }
      }
    }

    return { fixed, deleted, total: allIncidents.length };
  },
});
