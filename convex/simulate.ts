import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Simulación de llamada entrante para testing
 * Crea un Call y un Incident en estado "incoming_call"
 * 
 * Uso: pnpx convex run simulate:simulateIncomingCall
 */
export const simulateIncomingCall = internalMutation({
  args: {
    callerPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Necesitamos un dispatcher para crear el incidente (requerido en schema)
    // En producción, esto se asignará cuando un dispatcher acepte
    // Para simulación, obtenemos el primer dispatcher disponible o creamos uno temporal
    const dispatcher = await ctx.db.query("dispatchers").first();
    if (!dispatcher) {
      throw new Error("No dispatcher found. Please seed dispatchers first.");
    }

    // Crear incidente en estado incoming_call (schema de main)
    // Nota: En producción real, el backend creará el incidente sin dispatcher primero
    // y luego se asignará cuando un dispatcher lo acepte. Para simulación usamos el primero disponible.
    const incidentId = await ctx.db.insert("incidents", {
      status: "incoming_call",
      priority: "medium",
      address: "", // Se llenará con AI
      dispatcherId: dispatcher._id, // Temporal para simulación
      lastUpdated: Date.now(),
    });

    // Crear call asociado (schema de main: solo incidentId y transcriptionChunks)
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
    };
  },
});

/**
 * Simulación de chunk de transcripción
 * Agrega un nuevo chunk a una llamada existente
 * Schema de main: chunks tienen speaker
 * 
 * Uso: pnpx convex run simulate:simulateTranscriptionChunk '{ "callId": "...", "chunk": {"offset": 2, "speaker": "caller", "text": "..."} }'
 */
export const simulateTranscriptionChunk = internalMutation({
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

    // Actualizar también el texto completo
    const fullText = newChunks.map(chunk => chunk.text).join(" ");

    await ctx.db.patch(args.callId, {
      transcriptionChunks: newChunks,
      transcription: fullText,
    });

    return { success: true, totalChunks: newChunks.length };
  },
});

