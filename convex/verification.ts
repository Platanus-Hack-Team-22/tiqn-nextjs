import { query } from "./_generated/server";

export const getDispatchers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dispatchers").collect();
  },
});

export const getIncidents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("incidents").collect();
  },
});

export const getPatients = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("patients").collect();
  },
});

