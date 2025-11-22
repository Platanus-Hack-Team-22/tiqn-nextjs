import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new dispatcher
 */
export const create = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dispatcherId = await ctx.db.insert("dispatchers", args);
    return dispatcherId;
  },
});

/**
 * Get all dispatchers
 */
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("dispatchers").collect();
  },
});

/**
 * Get dispatcher by ID
 */
export const get = query({
  args: {
    id: v.id("dispatchers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

