import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // --------------------------------------------------------------------------
  // PATIENTS
  // --------------------------------------------------------------------------
  patients: defineTable({
    rut: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    age: v.optional(v.number()),
    sex: v.optional(v.union(v.literal("M"), v.literal("F"), v.literal("Other"))),
    phone: v.optional(v.string()),

    // Address
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    district: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),

    // Medical Info
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

    // Metadata
    photoUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(), // timestamp
    updatedAt: v.number(), // timestamp
  }).index("by_rut", ["rut"]),

  // --------------------------------------------------------------------------
  // DISPATCHERS (Operators)
  // --------------------------------------------------------------------------
  dispatchers: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
  }),

  // --------------------------------------------------------------------------
  // RESCUERS (First Responders)
  // --------------------------------------------------------------------------
  rescuers: defineTable({
    name: v.string(),
    phone: v.string(),
    
    // Stats (optional)
    stats: v.optional(
      v.object({
        totalRescues: v.number(),
        avgResponseTime: v.optional(v.number()),
      })
    ),
  }),

  // --------------------------------------------------------------------------
  // INCIDENTS (Emergencies)
  // --------------------------------------------------------------------------
  incidents: defineTable({
    incidentNumber: v.string(), // e.g. INC-2024-0892

    // Status & Priority
    status: v.union(
      v.literal("incoming_call"),
      v.literal("confirmed"),
      v.literal("rescuer_assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),

    // Basic Info
    incidentType: v.optional(v.string()),
    description: v.optional(v.string()),

    // Location
    location: v.object({
      address: v.string(),
      city: v.optional(v.string()),
      district: v.optional(v.string()),
      coordinates: v.optional(
        v.object({
          lat: v.number(),
          lng: v.number(),
        })
      ),
      reference: v.optional(v.string()),
    }),

    // Relationships
    dispatcherId: v.id("dispatchers"),
    patientId: v.optional(v.id("patients")),
  })
    .index("by_status", ["status"])
    .index("by_dispatcher", ["dispatcherId"])
    .index("by_patient", ["patientId"]),

  // --------------------------------------------------------------------------
  // CALLS (Twilio integration)
  // --------------------------------------------------------------------------
  calls: defineTable({
    incidentId: v.id("incidents"),

    // Transcription
    transcription: v.optional(v.string()),
    transcriptionChunks: v.optional(
      v.array(
        v.object({
          offset: v.number(),
          speaker: v.union(v.literal("caller"), v.literal("dispatcher"), v.literal("system")),
          text: v.string(),
        })
      )
    ),
  }).index("by_incident", ["incidentId"]),

  // --------------------------------------------------------------------------
  // INCIDENT ASSIGNMENTS (Orchestration)
  // --------------------------------------------------------------------------
  incidentAssignments: defineTable({
    incidentId: v.id("incidents"),
    rescuerId: v.id("rescuers"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("cancelled")
    ),
    times: v.optional(
      v.object({
        offered: v.number(),
        responded: v.optional(v.number()),
        accepted: v.optional(v.number()),
      })
    ),
  })
    .index("by_incident", ["incidentId"])
    .index("by_rescuer", ["rescuerId"])
    .index("by_status", ["status"]),
});

