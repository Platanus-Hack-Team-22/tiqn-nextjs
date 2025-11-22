import { internalMutation } from "./_generated/server";

/**
 * Limpia toda la base de datos (solo para desarrollo/testing)
 * Elimina todos los datos de todas las tablas
 */
export const clearAllData = internalMutation({
  handler: async (ctx) => {
    // Eliminar en orden inverso de dependencias
    const incidentAssignments = await ctx.db.query("incidentAssignments").collect();
    for (const item of incidentAssignments) {
      await ctx.db.delete(item._id);
    }

    // Nota: incidentUpdates no existe en schema de main
    // const incidentUpdates = await ctx.db.query("incidentUpdates").collect();
    // for (const item of incidentUpdates) {
    //   await ctx.db.delete(item._id);
    // }

    // Nota: patientMatches no existe en schema de main
    // const patientMatches = await ctx.db.query("patientMatches").collect();
    // for (const item of patientMatches) {
    //   await ctx.db.delete(item._id);
    // }

    const calls = await ctx.db.query("calls").collect();
    for (const call of calls) {
      await ctx.db.delete(call._id);
    }

    const incidents = await ctx.db.query("incidents").collect();
    for (const incident of incidents) {
      await ctx.db.delete(incident._id);
    }

    const patients = await ctx.db.query("patients").collect();
    for (const patient of patients) {
      await ctx.db.delete(patient._id);
    }

    const rescuers = await ctx.db.query("rescuers").collect();
    for (const rescuer of rescuers) {
      await ctx.db.delete(rescuer._id);
    }

    const dispatchers = await ctx.db.query("dispatchers").collect();
    for (const dispatcher of dispatchers) {
      await ctx.db.delete(dispatcher._id);
    }

    return {
      deleted: {
        incidentAssignments: incidentAssignments.length,
        // incidentUpdates: incidentUpdates.length, // No existe en schema de main
        // patientMatches: patientMatches.length, // No existe en schema de main
        calls: calls.length,
        incidents: incidents.length,
        patients: patients.length,
        rescuers: rescuers.length,
        dispatchers: dispatchers.length,
      },
    };
  },
});

/**
 * Limpia incidentes que no cumplen el schema (sin dispatcherId)
 * Solo para desarrollo/testing
 */
export const fixOrphanedIncidents = internalMutation({
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
      // Verificar si tiene dispatcherId (aunque TypeScript dice que es requerido, puede haber datos antiguos)
      // Usamos type assertion porque TypeScript dice que es requerido pero puede haber datos antiguos
      if (!(incident as { dispatcherId?: string }).dispatcherId) {
        // Si es incoming_call, asignar primer dispatcher
        if (incident.status === "incoming_call" && firstDispatcher) {
          await ctx.db.patch(incident._id, {
            dispatcherId: firstDispatcher._id,
          });
          fixed++;
        } else {
          // Para otros estados, eliminar si no tiene dispatcher (datos corruptos)
          await ctx.db.delete(incident._id);
          deleted++;
        }
      }
    }

    return { fixed, deleted, total: allIncidents.length };
  },
});
