import { query } from "./_generated/server";

/**
 * Queries simples para leer TODOS los datos de cualquier deployment
 * Estas funciones son genéricas y pueden usarse en prod o dev
 */

export const getAllDispatchers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dispatchers").collect();
  },
});

export const getAllRescuers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rescuers").collect();
  },
});

export const getAllPatients = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("patients").collect();
  },
});

export const getAllIncidents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("incidents").collect();
  },
});

export const getAllCalls = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("calls").collect();
  },
});

export const getAllIncidentAssignments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("incidentAssignments").collect();
  },
});

export const getAppState = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("app_state")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
  },
});

