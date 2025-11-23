import { mutation } from "./_generated/server";
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
