import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create patient record (called by backend)
export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    age: v.optional(v.number()),
    sex: v.optional(v.union(v.literal("M"), v.literal("F"), v.literal("Other"))),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    district: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    medications: v.optional(v.array(v.string())),
    allergies: v.optional(v.array(v.string())),
    medicalHistory: v.optional(v.array(v.string())),
    bloodType: v.optional(v.string()),
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        phone: v.string(),
      })
    ),
    photoUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { createdAt, updatedAt, ...patientData } = args;
    return await ctx.db.insert("patients", {
      ...patientData,
      medicalHistory: patientData.medicalHistory || [],
      medications: patientData.medications || [],
      allergies: patientData.allergies || [],
      createdAt,
      updatedAt,
    });
  },
});

// Get patient by ID (called by backend)
export const get = query({
  args: { id: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

