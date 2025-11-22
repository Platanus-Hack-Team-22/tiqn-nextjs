import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  app_state: defineTable({
    activeDispatcherId: v.optional(v.id("dispatchers")),
    key: v.literal("global"),
  }).index("by_key", ["key"]),

  calls: defineTable({
    incidentId: v.id("incidents"),
    transcription: v.optional(v.string()),
    transcriptionChunks: v.optional(
      v.array(
        v.object({
          offset: v.float64(),
          speaker: v.union(
            v.literal("caller"),
            v.literal("dispatcher"),
            v.literal("system")
          ),
          text: v.string(),
        })
      )
    ),
  }).index("by_incident", ["incidentId"]),

  dispatchers: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
  }),

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
        accepted: v.optional(v.float64()),
        completed: v.optional(v.float64()),
        offered: v.float64(),
        responded: v.optional(v.float64()),
      })
    ),
  })
    .index("by_incident", ["incidentId"])
    .index("by_rescuer", ["rescuerId"])
    .index("by_status", ["status"]),

  incidents: defineTable({
    address: v.optional(v.string()),
    allergies: v.optional(v.string()),
    apartment: v.optional(v.string()),
    avdi: v.optional(v.string()),
    breathing: v.optional(v.string()),
    callSessionId: v.optional(v.string()),
    conciergeNotified: v.optional(v.string()),
    consciousness: v.optional(v.string()),
    coordinates: v.optional(
      v.object({ lat: v.float64(), lng: v.float64() })
    ),
    currentMedications: v.optional(v.string()),
    description: v.optional(v.string()),
    dispatcherId: v.id("dispatchers"),
    district: v.optional(v.string()),
    firstName: v.optional(v.string()),
    fullTranscript: v.optional(v.string()),
    healthInsurance: v.optional(v.string()),
    incidentType: v.optional(v.string()),
    lastName: v.optional(v.string()),
    lastUpdated: v.optional(v.float64()),
    medicalHistory: v.optional(v.string()),
    patientAge: v.optional(v.float64()),
    patientId: v.optional(v.id("patients")),
    patientSex: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    rawCanonicalData: v.optional(v.any()),
    reference: v.optional(v.string()),
    requiredRescuers: v.optional(v.string()),
    requiredResources: v.optional(v.string()),
    respiratoryStatus: v.optional(v.string()),
    status: v.union(
      v.literal("incoming_call"),
      v.literal("confirmed"),
      v.literal("rescuer_assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    symptomOnset: v.optional(v.string()),
    vitalSigns: v.optional(v.string()),
  })
    .index("by_dispatcher", ["dispatcherId"])
    .index("by_patient", ["patientId"])
    .index("by_session", ["callSessionId"])
    .index("by_status", ["status"]),

  patients: defineTable({
    address: v.optional(v.string()),
    age: v.optional(v.float64()),
    allergies: v.array(v.string()),
    bloodType: v.optional(v.string()),
    city: v.optional(v.string()),
    coordinates: v.optional(
      v.object({ lat: v.float64(), lng: v.float64() })
    ),
    createdAt: v.float64(),
    district: v.optional(v.string()),
    emergencyContact: v.optional(
      v.object({ name: v.string(), phone: v.string() })
    ),
    firstName: v.string(),
    lastName: v.string(),
    medicalHistory: v.array(v.string()),
    medications: v.array(v.string()),
    notes: v.optional(v.string()),
    phone: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    rut: v.optional(v.string()),
    sex: v.optional(
      v.union(
        v.literal("M"),
        v.literal("F"),
        v.literal("Other")
      )
    ),
    updatedAt: v.float64(),
  }).index("by_rut", ["rut"]),

  rescuers: defineTable({
    currentLocation: v.optional(
      v.object({
        lastUpdated: v.optional(v.float64()),
        lat: v.float64(),
        lng: v.float64(),
      })
    ),
    name: v.string(),
    phone: v.string(),
    stats: v.optional(
      v.object({
        avgResponseTime: v.optional(v.float64()),
        totalRescues: v.float64(),
      })
    ),
  }),
});
