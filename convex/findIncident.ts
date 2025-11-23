import { query } from "./_generated/server";
import { v } from "convex/values";

// Query temporal para encontrar el incidente por callSessionId
export const findBySession = query({
  args: {
    callSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .withIndex("by_session", (q) => q.eq("callSessionId", args.callSessionId))
      .first();
    
    if (!incident) {
      return { found: false };
    }

    // Buscar call asociado
    const call = await ctx.db
      .query("calls")
      .withIndex("by_incident", (q) => q.eq("incidentId", incident._id))
      .first();

    return {
      found: true,
      incidentId: incident._id,
      callId: call?._id || null,
      hasCall: !!call,
    };
  },
});

