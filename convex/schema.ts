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

  known_patient_records: defineTable({
    profilePicture: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    bloodType: v.optional(v.string()),
    visitNotes: v.optional(v.string()),
  })
    .index("by_first_name", ["firstName"])
    .index("by_last_name", ["lastName"]),

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

    currentLocation: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        lastUpdated: v.optional(v.number()),
      })
    ),

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
    // Status & Priority - OPTIONAL because Python may not always send them
    status: v.optional(v.union(
      v.literal("incoming_call"),
      v.literal("confirmed"),
      v.literal("rescuer_assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("active") // Added for Python backend compatibility
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),

    // Basic Info
    incidentType: v.optional(v.string()),
    description: v.optional(v.string()),

    // Location (split into separate fields)
    address: v.optional(v.string()),
    district: v.optional(v.string()),
    reference: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),

    // Relationships
    dispatcherId: v.union(v.id("dispatchers"), v.string()), // Accept both ID and string from Python
    patientId: v.optional(v.id("patients")),

    // Real-time call tracking (from Python AI extraction)
    callSessionId: v.optional(v.string()),
    externalCallId: v.optional(v.string()), // Alias for callSessionId (Python backend uses this)
    liveTranscript: v.optional(v.string()), // Real-time interim transcript updates
    lastUpdated: v.optional(v.number()),

    // Patient info (extracted during call)
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    patientAge: v.optional(v.number()),
    patientSex: v.optional(v.string()),

    // Medical status
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

    // Location details
    apartment: v.optional(v.string()),

    // Resources
    requiredRescuers: v.optional(v.string()),
    requiredResources: v.optional(v.string()),

    // Administrative
    healthInsurance: v.optional(v.string()),
    conciergeNotified: v.optional(v.string()),

    // Complete data
    fullTranscript: v.optional(v.string()),
    rawCanonicalData: v.optional(v.any()),
  })
    .index("by_status", ["status"])
    .index("by_dispatcher", ["dispatcherId"])
    .index("by_patient", ["patientId"])
    .index("by_session", ["callSessionId"])
    .index("by_externalCallId", ["externalCallId"]),

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
    rescuerId: v.optional(v.id("rescuers")),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    times: v.optional(
      v.object({
        offered: v.number(),
        responded: v.optional(v.number()),
        accepted: v.optional(v.number()),
        completed: v.optional(v.number()),
      })
    ),
  })
    .index("by_incident", ["incidentId"])
    .index("by_rescuer", ["rescuerId"])
    .index("by_status", ["status"]),

  // --------------------------------------------------------------------------
  // APP STATE (Singleton)
  // --------------------------------------------------------------------------
  app_state: defineTable({
    key: v.literal("global"),
    activeDispatcherId: v.optional(v.id("dispatchers")),
    activeIncidentId: v.optional(v.id("incidents")),
  }).index("by_key", ["key"]),
});

