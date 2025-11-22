import { mutation } from "./_generated/server";

export const createTestAssignment = mutation({
  args: {},
  handler: async (ctx) => {
    const incident = await ctx.db.query("incidents").first();
    if (!incident) {
      throw new Error("No incident found");
    }

    const assignmentId = await ctx.db.insert("incidentAssignments", {
      incidentId: incident._id,
      status: "pending",
      times: {
        offered: Date.now(),
      },
    });

    return { success: true, assignmentId, incidentId: incident._id };
  },
});
