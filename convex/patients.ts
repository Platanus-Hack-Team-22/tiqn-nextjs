import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create patient record (called by backend)
export const create = mutation({
  args: {
    rut: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    age: v.optional(v.float64()),
    sex: v.optional(v.union(v.literal("M"), v.literal("F"), v.literal("Other"))),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    district: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        lat: v.float64(),
        lng: v.float64(),
      })
    ),
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
    // Allow system fields to be passed (will be overwritten)
    createdAt: v.optional(v.float64()),
    updatedAt: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const { createdAt, updatedAt, ...cleanArgs } = args;
    
    const patientId = await ctx.db.insert("patients", {
      ...cleanArgs,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return patientId;
  },
});

// Get patient by ID (called by backend)
export const get = query({
  args: {
    id: v.id("patients"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
