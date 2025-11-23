import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createPendingAssignment = mutation({
  args: {
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    const assignmentId = await ctx.db.insert("incidentAssignments", {
      incidentId: args.incidentId,
      status: "pending",
      times: {
        offered: Date.now(),
      },
    });

    return { success: true, assignmentId, incidentId: args.incidentId };
  },
});

/**
 * Check if an incident has an assignment
 */
export const getByIncident = query({
  args: {
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidentAssignments")
      .withIndex("by_incident", (q) => q.eq("incidentId", args.incidentId))
      .first();
  },
});
