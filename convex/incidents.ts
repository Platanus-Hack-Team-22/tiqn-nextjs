import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create or update incident in real-time as Python AI extracts data
 */
export const createOrUpdate = mutation({
  args: {
    // Support both naming conventions (Python backend uses externalCallId)
    callSessionId: v.optional(v.string()),
    externalCallId: v.optional(v.string()),
    dispatcherId: v.union(v.id("dispatchers"), v.string()), // Accept both ID and string

    // Status (Python backend may send "active")
    status: v.optional(v.union(
      v.literal("incoming_call"),
      v.literal("confirmed"),
      v.literal("rescuer_assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("active")
    )),

    // Optional - only provided fields will be updated
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),

    // Real-time transcript (Python backend uses this for interim updates)
    liveTranscript: v.optional(v.string()),

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

    // Handle both naming conventions: externalCallId (Python) and callSessionId (internal)
    const sessionId = args.externalCallId || args.callSessionId;
    const { callSessionId, externalCallId, dispatcherId, ...updateData } = args;

    if (!sessionId) {
      throw new Error("Either callSessionId or externalCallId must be provided");
    }

    // Try to find existing incident by either field
    let existing = await ctx.db
      .query("incidents")
      .withIndex("by_session", (q) => q.eq("callSessionId", sessionId))
      .first();

    if (!existing && externalCallId) {
      existing = await ctx.db
        .query("incidents")
        .withIndex("by_externalCallId", (q) => q.eq("externalCallId", externalCallId))
        .first();
    }

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
        callSessionId: sessionId,
        externalCallId: sessionId, // Store in both fields for compatibility
        dispatcherId,
        status: args.status, // Don't provide default - let it be undefined if not sent
        priority: args.priority, // Don't provide default - let it be undefined if not sent
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

/**
 * Update coordinates for an incident
 */
export const updateCoordinates = mutation({
  args: {
    callSessionId: v.string(),
    coordinates: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("incidents")
      .withIndex("by_session", (q) => q.eq("callSessionId", args.callSessionId))
      .first();

    if (!existing) {
      throw new Error(`Incident not found for session: ${args.callSessionId}`);
    }

    await ctx.db.patch(existing._id, {
      coordinates: args.coordinates,
      lastUpdated: Date.now(),
    });

    return existing._id;
  },
});
