import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    rut: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    age: v.optional(v.number()),
    sex: v.optional(v.union(v.literal("M"), v.literal("F"), v.literal("Other"))),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    district: v.optional(v.string()),
    medicalHistory: v.array(v.string()),
    medications: v.array(v.string()),
    allergies: v.array(v.string()),
    bloodType: v.optional(v.string()),
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        phone: v.string(),
      })
    ),
    photoUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    // Allow system fields to be passed (will be ignored/overwritten)
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Filter out system fields to ensure we don't pass them to insert if we want clean behavior,
    // but since we overwrite them below, it's fine.
    // However, to be cleaner, let's destructure them out if we want to be explicit.
    // But for now, just adding them to validator is enough to stop the error.
    const { createdAt, updatedAt, ...cleanArgs } = args;
    
    const patientId = await ctx.db.insert("patients", {
      ...cleanArgs,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return patientId;
  },
});

export const get = query({
  args: {
    id: v.id("patients"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

