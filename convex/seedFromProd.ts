import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Mutations para poblar dev con datos de producción
 * Estos mutations SOLO se ejecutan en dev, nunca en prod
 */

export const seedDispatchers = internalMutation({
  args: {
    dispatchers: v.array(
      v.object({
        name: v.string(),
        phone: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids: string[] = [];
    for (const dispatcher of args.dispatchers) {
      const id = await ctx.db.insert("dispatchers", dispatcher);
      ids.push(id);
    }
    return { inserted: ids.length, ids };
  },
});

export const seedRescuers = internalMutation({
  args: {
    rescuers: v.array(
      v.object({
        name: v.string(),
        phone: v.string(),
        currentLocation: v.optional(
          v.object({
            lat: v.float64(),
            lng: v.float64(),
            lastUpdated: v.optional(v.float64()),
          })
        ),
        stats: v.optional(
          v.object({
            totalRescues: v.float64(),
            avgResponseTime: v.optional(v.float64()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids: string[] = [];
    for (const rescuer of args.rescuers) {
      const id = await ctx.db.insert("rescuers", rescuer);
      ids.push(id);
    }
    return { inserted: ids.length, ids };
  },
});

export const seedPatients = internalMutation({
  args: {
    patients: v.array(
      v.object({
        firstName: v.string(),
        lastName: v.string(),
        age: v.optional(v.float64()),
        sex: v.optional(v.union(v.literal("M"), v.literal("F"), v.literal("Other"))),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        district: v.optional(v.string()),
        coordinates: v.optional(
          v.object({
            lat: v.float64(),
            lng: v.float64(),
          })
        ),
        medicalHistory: v.array(v.string()),
        medications: v.array(v.string()),
        allergies: v.array(v.string()),
        bloodType: v.optional(v.string()),
        emergencyContact: v.optional(
          v.object({
            name: v.string(),
            phone: v.string(),
          })
        ),
        photoUrl: v.optional(v.string()),
        notes: v.optional(v.string()),
        rut: v.optional(v.string()),
        createdAt: v.float64(),
        updatedAt: v.float64(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids: string[] = [];
    for (const patient of args.patients) {
      const id = await ctx.db.insert("patients", patient);
      ids.push(id);
    }
    return { inserted: ids.length, ids };
  },
});

export const seedIncidents = internalMutation({
  args: {
    incidents: v.array(
      v.object({
        status: v.union(
          v.literal("incoming_call"),
          v.literal("confirmed"),
          v.literal("rescuer_assigned"),
          v.literal("in_progress"),
          v.literal("completed"),
          v.literal("cancelled")
        ),
        priority: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high"),
          v.literal("critical")
        ),
        dispatcherId: v.id("dispatchers"),
        address: v.optional(v.string()),
        district: v.optional(v.string()),
        reference: v.optional(v.string()),
        apartment: v.optional(v.string()),
        coordinates: v.optional(
          v.object({
            lat: v.float64(),
            lng: v.float64(),
          })
        ),
        callSessionId: v.optional(v.string()),
        lastUpdated: v.optional(v.float64()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        patientAge: v.optional(v.float64()),
        patientSex: v.optional(v.string()),
        patientId: v.optional(v.id("patients")),
        consciousness: v.optional(v.string()),
        breathing: v.optional(v.string()),
        avdi: v.optional(v.string()),
        respiratoryStatus: v.optional(v.string()),
        symptomOnset: v.optional(v.string()),
        medicalHistory: v.optional(v.string()),
        currentMedications: v.optional(v.string()),
        allergies: v.optional(v.string()),
        vitalSigns: v.optional(v.string()),
        requiredRescuers: v.optional(v.string()),
        requiredResources: v.optional(v.string()),
        healthInsurance: v.optional(v.string()),
        conciergeNotified: v.optional(v.string()),
        incidentType: v.optional(v.string()),
        description: v.optional(v.string()),
        fullTranscript: v.optional(v.string()),
        rawCanonicalData: v.optional(v.any()),
      })
    ),
    dispatcherIdMap: v.optional(v.any()), // Mapa de IDs viejos a nuevos
    patientIdMap: v.optional(v.any()), // Mapa de IDs viejos a nuevos
  },
  handler: async (ctx, args) => {
    const ids: string[] = [];
    const dispatcherIdMap = args.dispatcherIdMap || {};
    const patientIdMap = args.patientIdMap || {};

    for (const incident of args.incidents) {
      // Mapear dispatcherId si existe en el mapa
      const newDispatcherId = dispatcherIdMap[incident.dispatcherId] || incident.dispatcherId;
      
      // Mapear patientId si existe en el mapa
      const newPatientId = incident.patientId && patientIdMap[incident.patientId] 
        ? patientIdMap[incident.patientId] 
        : incident.patientId;

      const id = await ctx.db.insert("incidents", {
        ...incident,
        dispatcherId: newDispatcherId as any,
        patientId: newPatientId as any,
      });
      ids.push(id);
    }
    return { inserted: ids.length, ids };
  },
});

export const seedCalls = internalMutation({
  args: {
    calls: v.array(
      v.object({
        incidentId: v.id("incidents"),
        transcription: v.optional(v.string()),
        transcriptionChunks: v.optional(
          v.array(
            v.object({
              offset: v.float64(),
              speaker: v.union(
                v.literal("caller"),
                v.literal("dispatcher"),
                v.literal("system")
              ),
              text: v.string(),
            })
          )
        ),
      })
    ),
    incidentIdMap: v.optional(v.any()), // Mapa de IDs viejos a nuevos
  },
  handler: async (ctx, args) => {
    const ids: string[] = [];
    const incidentIdMap = args.incidentIdMap || {};

    for (const call of args.calls) {
      // Mapear incidentId si existe en el mapa
      const newIncidentId = incidentIdMap[call.incidentId] || call.incidentId;

      const id = await ctx.db.insert("calls", {
        ...call,
        incidentId: newIncidentId as any,
      });
      ids.push(id);
    }
    return { inserted: ids.length, ids };
  },
});

export const seedIncidentAssignments = internalMutation({
  args: {
    assignments: v.array(
      v.object({
        incidentId: v.id("incidents"),
        rescuerId: v.optional(v.id("rescuers")),
        status: v.union(
          v.literal("pending"),
          v.literal("accepted"),
          v.literal("rejected"),
          v.literal("cancelled"),
          v.literal("completed")
        ),
        times: v.optional(
          v.object({
            offered: v.float64(),
            responded: v.optional(v.float64()),
            accepted: v.optional(v.float64()),
            completed: v.optional(v.float64()),
          })
        ),
      })
    ),
    incidentIdMap: v.optional(v.any()),
    rescuerIdMap: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const ids: string[] = [];
    const incidentIdMap = args.incidentIdMap || {};
    const rescuerIdMap = args.rescuerIdMap || {};

    for (const assignment of args.assignments) {
      const newIncidentId = incidentIdMap[assignment.incidentId] || assignment.incidentId;
      const newRescuerId = assignment.rescuerId && rescuerIdMap[assignment.rescuerId]
        ? rescuerIdMap[assignment.rescuerId]
        : assignment.rescuerId;

      const id = await ctx.db.insert("incidentAssignments", {
        ...assignment,
        incidentId: newIncidentId as any,
        rescuerId: newRescuerId as any,
      });
      ids.push(id);
    }
    return { inserted: ids.length, ids };
  },
});

export const seedAppState = internalMutation({
  args: {
    appState: v.optional(
      v.object({
        activeDispatcherId: v.optional(v.id("dispatchers")),
      })
    ),
    dispatcherIdMap: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    if (!args.appState) {
      return { inserted: false };
    }

    const dispatcherIdMap = args.dispatcherIdMap || {};
    const newDispatcherId = args.appState.activeDispatcherId && dispatcherIdMap[args.appState.activeDispatcherId]
      ? dispatcherIdMap[args.appState.activeDispatcherId]
      : args.appState.activeDispatcherId;

    await ctx.db.insert("app_state", {
      key: "global",
      activeDispatcherId: newDispatcherId as any,
    });

    return { inserted: true };
  },
});

