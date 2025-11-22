import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

