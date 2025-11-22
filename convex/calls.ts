import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get call/transcription data for an incident
export const getCallByIncident = query({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calls")
      .withIndex("by_incident", (q) => q.eq("incidentId", args.incidentId))
      .first();
  },
});

// Create incoming call (called by backend when Twilio call arrives)
// Nota: Esta función puede no ser usada si el backend usa createOrUpdate directamente
export const createIncomingCall = mutation({
  args: {
    twilioCallSid: v.optional(v.string()),
    callerPhone: v.optional(v.string()),
    startedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Obtener primer dispatcher disponible
    const dispatcher = await ctx.db.query("dispatchers").first();
    if (!dispatcher) {
      throw new Error("No dispatcher found. Please seed dispatchers first.");
    }

    // Crear incidente en estado incoming_call (schema de main)
    const incidentId = await ctx.db.insert("incidents", {
      status: "incoming_call",
      priority: "medium",
      dispatcherId: dispatcher._id,
      lastUpdated: Date.now(),
    });

    // Crear call asociado (schema de main - solo incidentId y transcriptionChunks)
    const callId = await ctx.db.insert("calls", {
      incidentId,
      transcriptionChunks: [
        {
          offset: 0,
          speaker: "system",
          text: "Llamada entrante...",
        },
      ],
    });

    return {
      callId,
      incidentId,
      twilioCallSid: args.twilioCallSid,
    };
  },
});

// Create call record (called by backend when call ends)
// Schema de main: solo incidentId, transcription, transcriptionChunks (con speaker)
export const create = mutation({
  args: {
    incidentId: v.id("incidents"),
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
  },
  handler: async (ctx, args) => {
    // Verificar si ya existe un call para este incidente
    const existing = await ctx.db
      .query("calls")
      .withIndex("by_incident", (q) => q.eq("incidentId", args.incidentId))
      .first();

    if (existing) {
      // Actualizar call existente
      await ctx.db.patch(existing._id, {
        transcription: args.transcription ?? existing.transcription,
        transcriptionChunks: args.transcriptionChunks ?? existing.transcriptionChunks,
      });
      return existing._id;
    }

    // Crear nuevo call (schema de main)
    return await ctx.db.insert("calls", {
      incidentId: args.incidentId,
      transcription: args.transcription,
      transcriptionChunks: args.transcriptionChunks,
    });
  },
});

// Add transcription chunk (called by backend during call)
// Schema de main: chunks tienen speaker
export const addTranscriptionChunk = mutation({
  args: {
    callId: v.id("calls"),
    chunk: v.object({
      offset: v.number(),
      speaker: v.union(v.literal("caller"), v.literal("dispatcher"), v.literal("system")),
      text: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    const existingChunks = call.transcriptionChunks || [];
    const newChunks = [...existingChunks, args.chunk].sort((a, b) => a.offset - b.offset);

    // Actualizar también el texto completo concatenando todos los chunks
    const fullText = newChunks.map(chunk => chunk.text).join(" ");

    await ctx.db.patch(args.callId, {
      transcriptionChunks: newChunks,
      transcription: fullText,
    });

    return { success: true, totalChunks: newChunks.length };
  },
});

