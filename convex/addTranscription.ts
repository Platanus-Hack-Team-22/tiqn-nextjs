import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Script temporal para agregar transcripción al incidente de prueba
export const addTestTranscription = mutation({
  args: {
    callSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Buscar el incidente por callSessionId
    const incident = await ctx.db
      .query("incidents")
      .withIndex("by_session", (q) => q.eq("callSessionId", args.callSessionId))
      .first();

    if (!incident) {
      throw new Error(`Incident not found with callSessionId: ${args.callSessionId}`);
    }

    // Buscar o crear el call asociado
    let call = await ctx.db
      .query("calls")
      .withIndex("by_incident", (q) => q.eq("incidentId", incident._id))
      .first();

    if (!call) {
      // Crear call si no existe
      const callId = await ctx.db.insert("calls", {
        incidentId: incident._id,
        transcriptionChunks: [],
      });
      call = await ctx.db.get(callId);
      if (!call) {
        throw new Error("Failed to create call");
      }
    }

    // Agregar chunks de transcripción simulados
    const chunks = [
      {
        offset: 0,
        speaker: "system" as const,
        text: "Llamada conectada. Iniciando transcripción...",
      },
      {
        offset: 2,
        speaker: "dispatcher" as const,
        text: "TIQN Emergency Dispatch. ¿Cuál es su emergencia?",
      },
      {
        offset: 5,
        speaker: "caller" as const,
        text: "Por favor ayuda, creo que mi padre está teniendo un ataque al corazón.",
      },
      {
        offset: 12,
        speaker: "dispatcher" as const,
        text: "Entendido. ¿Dónde se encuentra?",
      },
      {
        offset: 15,
        speaker: "caller" as const,
        text: "Estamos en Av. Test 123, Santiago, departamento 4B.",
      },
      {
        offset: 20,
        speaker: "dispatcher" as const,
        text: "¿Su padre está consciente? ¿Respira?",
      },
      {
        offset: 23,
        speaker: "caller" as const,
        text: "Sí, está consciente pero tiene mucho dolor en el pecho. Respira con dificultad.",
      },
      {
        offset: 30,
        speaker: "dispatcher" as const,
        text: "Perfecto. Estoy enviando una ambulancia. ¿Tiene alguna alergia o medicación conocida?",
      },
      {
        offset: 35,
        speaker: "caller" as const,
        text: "Tiene alergia a la penicilina. Toma medicamentos para la presión arterial.",
      },
    ];

    // Actualizar call con todos los chunks
    const existingChunks = call.transcriptionChunks || [];
    const allChunks = [...existingChunks, ...chunks].sort((a, b) => a.offset - b.offset);
    const fullText = allChunks.map((chunk) => chunk.text).join(" ");

    await ctx.db.patch(call._id, {
      transcriptionChunks: allChunks,
      transcription: fullText,
    });

    return {
      success: true,
      callId: call._id,
      incidentId: incident._id,
      totalChunks: allChunks.length,
    };
  },
});

