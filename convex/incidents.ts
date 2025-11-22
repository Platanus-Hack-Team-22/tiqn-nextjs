import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create or update incident in real-time as Python AI extracts data
 */
export const createOrUpdate = mutation({
  args: {
    // Required
    callSessionId: v.string(),
    dispatcherId: v.id("dispatchers"),
    
    // Optional - only provided fields will be updated
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    
    // Patient data
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    patientAge: v.optional(v.number()),
    patientSex: v.optional(v.string()),
    consciousness: v.optional(v.string()),
    breathing: v.optional(v.string()),
    avdi: v.optional(v.string()),
    respiratoryStatus: v.optional(v.string()),
    
    // Medical details
    symptomOnset: v.optional(v.string()),
    medicalHistory: v.optional(v.string()),
    currentMedications: v.optional(v.string()),
    allergies: v.optional(v.string()),
    vitalSigns: v.optional(v.string()),
    
    // Location (separate fields)
    address: v.optional(v.string()),
    district: v.optional(v.string()),
    reference: v.optional(v.string()),
    apartment: v.optional(v.string()),
    
    // Resources
    requiredRescuers: v.optional(v.string()),
    requiredResources: v.optional(v.string()),
    
    // Administrative
    healthInsurance: v.optional(v.string()),
    conciergeNotified: v.optional(v.string()),
    
    // Incident info
    incidentType: v.optional(v.string()),
    description: v.optional(v.string()),
    
    // Complete data
    fullTranscript: v.optional(v.string()),
    rawCanonicalData: v.optional(v.any()),
  },
  
  handler: async (ctx, args) => {
    console.log("Calling incidents:createOrUpdate", args);
    const { callSessionId, dispatcherId, ...updateData } = args;
    
    // Try to find existing incident by session ID
    const existing = await ctx.db
      .query("incidents")
      .withIndex("by_session", (q) => q.eq("callSessionId", callSessionId))
      .first();
    
    if (existing) {
      // UPDATE existing incident
      await ctx.db.patch(existing._id, {
        ...updateData,
        lastUpdated: Date.now(),
      });
      return existing._id;
    } else {
      // CREATE new incident (first chunk of call)
      const incidentId = await ctx.db.insert("incidents", {
        callSessionId,
        dispatcherId,
        status: "incoming_call",
        priority: args.priority || "medium",
        address: args.address || "Unknown",
        lastUpdated: Date.now(),
        ...updateData,
      });
      return incidentId;
    }
  },
});

// Alias for the Python backend which expects "create"
export const create = createOrUpdate;

/**
 * Get incident by session ID (for Python backend)
 */
export const getBySession = query({
  args: {
    callSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidents")
      .withIndex("by_session", (q) => q.eq("callSessionId", args.callSessionId))
      .first();
  },
});

/**
 * Get incident by ID
 */
export const get = query({
  args: {
    id: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * List recent incidents
 */
export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("incidents")
      .order("desc")
      .take(limit);
  },
});
