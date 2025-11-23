import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const getActiveDispatcher = query({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db
      .query("app_state")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    return state?.activeDispatcherId;
  },
});

export const setActiveDispatcher = mutation({
  args: {
    dispatcherId: v.id("dispatchers"),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("app_state")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    if (state) {
      await ctx.db.patch(state._id, { activeDispatcherId: args.dispatcherId });
    } else {
      await ctx.db.insert("app_state", {
        key: "global",
        activeDispatcherId: args.dispatcherId,
      });
    }
  },
});

/**
 * Set the active incident (called by Python backend during live calls)
 */
export const setActiveIncident = mutation({
  args: {
    // Accept ID, string, or null so Python backend calls don't break
    incidentId: v.union(v.id("incidents"), v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    let incidentIdToStore: Id<"incidents"> | undefined;

    if (args.incidentId === null) {
      incidentIdToStore = undefined;
    } else if (typeof args.incidentId === "string") {
      const normalized = ctx.db.normalizeId("incidents", args.incidentId);
      if (normalized) {
        incidentIdToStore = normalized;
      } else {
        console.warn(
          "app_state:setActiveIncident received invalid incidentId string, clearing active incident",
          args.incidentId,
        );
        incidentIdToStore = undefined;
      }
    } else {
      incidentIdToStore = args.incidentId;
    }

    const state = await ctx.db
      .query("app_state")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    if (state) {
      await ctx.db.patch(state._id, {
        activeIncidentId: incidentIdToStore,
      });
    } else {
      await ctx.db.insert("app_state", {
        key: "global",
        activeIncidentId: incidentIdToStore,
      });
    }

    // Log for Python/backend usage
    if (incidentIdToStore) {
      console.log("Active incident set to:", incidentIdToStore);
    } else {
      console.log("Active incident cleared (null or invalid id received)");
    }

    return { success: true };
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db
      .query("app_state")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    return state;
  },
});

