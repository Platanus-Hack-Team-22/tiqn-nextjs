import { query } from "./_generated/server";

/**
 * Queries para leer datos de producción (SOLO LECTURA)
 * Estos queries NO modifican nada, solo leen datos
 */

export const getProdDispatchers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dispatchers").collect();
  },
});

export const getProdRescuers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rescuers").collect();
  },
});

export const getProdPatients = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("patients").collect();
  },
});

export const getProdIncidents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("incidents").collect();
  },
});

export const getProdCalls = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("calls").collect();
  },
});

export const getProdIncidentAssignments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("incidentAssignments").collect();
  },
});

export const getProdAppState = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("app_state")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
  },
});

