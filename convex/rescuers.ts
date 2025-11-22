import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAvailableIncidents = query({
  args: {},
  handler: async (ctx) => {
    const pendingAssignments = await ctx.db
      .query("incidentAssignments")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const incidentsWithData = await Promise.all(
      pendingAssignments.map(async (assignment) => {
        const incident = await ctx.db.get(assignment.incidentId);
        if (!incident) {
          return null;
        }

        const patient = incident.patientId
          ? await ctx.db.get(incident.patientId)
          : null;

        return {
          assignment,
          incident,
          patient,
        };
      })
    );

    return incidentsWithData.filter((item) => item !== null);
  },
});

export const getRescuerActiveAssignment = query({
  args: {
    rescuerId: v.id("rescuers"),
  },
  handler: async (ctx, args) => {
    const activeAssignment = await ctx.db
      .query("incidentAssignments")
      .withIndex("by_rescuer", (q) => q.eq("rescuerId", args.rescuerId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();

    if (!activeAssignment) {
      return null;
    }

    const incident = await ctx.db.get(activeAssignment.incidentId);
    if (!incident) {
      return null;
    }

    const patient = incident.patientId
      ? await ctx.db.get(incident.patientId)
      : null;

    return {
      assignment: activeAssignment,
      incident,
      patient,
    };
  },
});

export const getRescuerDetails = query({
  args: {
    rescuerId: v.id("rescuers"),
  },
  handler: async (ctx, args) => {
    const rescuer = await ctx.db.get(args.rescuerId);
    return rescuer;
  },
});

export const getAllRescuers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rescuers").collect();
  },
});

export const acceptIncident = mutation({
  args: {
    incidentAssignmentId: v.id("incidentAssignments"),
    rescuerId: v.id("rescuers"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.incidentAssignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.status !== "pending") {
      throw new Error("Assignment is not pending");
    }

    const incident = await ctx.db.get(assignment.incidentId);
    if (!incident) {
      throw new Error("Incident not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.incidentAssignmentId, {
      rescuerId: args.rescuerId,
      status: "accepted",
      times: {
        offered: assignment.times?.offered ?? now,
        responded: now,
        accepted: now,
      },
    });

    await ctx.db.patch(assignment.incidentId, {
      status: "rescuer_assigned",
    });

    return { success: true };
  },
});

export const rejectIncident = mutation({
  args: {
    incidentAssignmentId: v.id("incidentAssignments"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.incidentAssignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.status !== "pending") {
      throw new Error("Assignment is not pending");
    }

    const now = Date.now();

    await ctx.db.patch(args.incidentAssignmentId, {
      status: "rejected",
      times: {
        offered: assignment.times?.offered ?? now,
        responded: now,
      },
    });

    return { success: true };
  },
});

export const completeIncident = mutation({
  args: {
    incidentAssignmentId: v.id("incidentAssignments"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.incidentAssignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.status !== "accepted") {
      throw new Error("Assignment is not accepted");
    }

    const incident = await ctx.db.get(assignment.incidentId);
    if (!incident) {
      throw new Error("Incident not found");
    }

    await ctx.db.patch(args.incidentAssignmentId, {
      status: "completed",
      times: assignment.times
        ? {
            ...assignment.times,
            completed: Date.now(),
          }
        : {
            offered: Date.now(),
            completed: Date.now(),
          },
    });

    await ctx.db.patch(assignment.incidentId, {
      status: "completed",
    });

    if (!assignment.rescuerId) {
      throw new Error("Assignment has no rescuer");
    }

    const rescuer = await ctx.db.get(assignment.rescuerId);
    if (!rescuer) {
      throw new Error("Rescuer not found");
    }

    const currentStats = rescuer.stats ?? {
      totalRescues: 0,
      avgResponseTime: undefined,
    };

    const newTotalRescues = currentStats.totalRescues + 1;

    let newAvgResponseTime = currentStats.avgResponseTime;
    if (assignment.times?.offered && assignment.times?.accepted) {
      const responseTime = (assignment.times.accepted - assignment.times.offered) / 60000;

      if (currentStats.avgResponseTime !== undefined) {
        newAvgResponseTime =
          (currentStats.avgResponseTime * currentStats.totalRescues + responseTime) /
          newTotalRescues;
      } else {
        newAvgResponseTime = responseTime;
      }
    }

    await ctx.db.patch(assignment.rescuerId, {
      stats: {
        totalRescues: newTotalRescues,
        avgResponseTime: newAvgResponseTime,
      },
    });

    return { success: true };
  },
});

export const updateRescuerLocation = mutation({
  args: {
    rescuerId: v.id("rescuers"),
    coordinates: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const rescuer = await ctx.db.get(args.rescuerId);
    if (!rescuer) {
      throw new Error("Rescuer not found");
    }

    return { success: true };
  },
});
