# Integración con Backend FastAPI

## Estado Actual del Backend

El backend está en `tiqn_backend/core_api/` y tiene:

1. **Transcripción en tiempo real** usando Azure Speech SDK
2. **Extracción de datos estructurados** usando Claude AI (31 campos canónicos)
3. **Integración con Convex** para guardar datos
4. **TODO pendiente**: Guardar chunks de transcripción incrementalmente

## Cómo Funciona el Backend

### Flujo de Llamada

```
Llamada Entrante (Twilio)
  ↓
WebSocket recibe audio chunks
  ↓
process_audio_chunk() por cada chunk:
  1. Transcribe audio → texto (Azure Whisper)
  2. Extrae datos estructurados (Claude AI)
  3. Actualiza sesión en memoria
  4. Actualiza Convex en tiempo real (update_incident_realtime)
  ↓
Cuando termina la llamada:
  - Guarda todo a Convex (save_emergency_call)
```

### Transcripción

El backend usa **Azure Speech SDK** para transcripción en tiempo real:
- Recibe audio chunks vía WebSocket
- Transcribe cada chunk usando `transcribe_audio_chunk_whisper()`
- Retorna texto transcrito por chunk
- **Problema actual**: No guarda los chunks individuales en Convex, solo el texto completo al final

## Mutations Necesarias en Convex

El backend necesita estas mutations para funcionar completamente:

### 1. ✅ Ya Existe: `calls:addTranscriptionChunk`

**Ubicación:** `convex/calls.ts`

**Uso por backend:**
```python
# Cuando llega un nuevo chunk de transcripción
convex_client.mutation("calls:addTranscriptionChunk", {
    "callId": "j975z58ekp84jqxdnzxga7va897vxtv0",
    "chunk": {
        "offset": 5.2,
        "speaker": "caller",  # o "dispatcher" o "system"
        "text": "Por favor ayuda, mi padre está teniendo un ataque al corazón..."
    }
})
```

**Nota:** Esta mutation ya existe en `convex/calls.ts` pero necesita ser exportada como `mutation` (no `internalMutation`) para que el backend pueda llamarla.

### 2. ✅ Ya Existe: `incidents:acceptCall`

**Ubicación:** `convex/incidents.ts`

**Uso por backend:**
```python
# Cuando dispatcher acepta la llamada
convex_client.mutation("incidents:acceptCall", {
    "incidentId": "jn73h58j8bna8phr92c4571yg57vxbmg",
    "dispatcherId": "jd75d5t1dvfgthz8c0hd5sj2f57vx6qs"
})
```

### 3. ✅ Ya Existe: `incidents:confirmEmergency`

**Ubicación:** `convex/incidents.ts`

**Uso por backend:**
```python
# Cuando dispatcher confirma la emergencia (crea assignment)
convex_client.mutation("incidents:confirmEmergency", {
    "incidentId": "jn73h58j8bna8phr92c4571yg57vxbmg"
})
```

### 4. ⚠️ Necesita Crearse: `calls:createIncomingCall`

**Para crear llamada entrante desde backend:**

```typescript
// convex/calls.ts
export const createIncomingCall = mutation({
  args: {
    twilioCallSid: v.string(),
    callerPhone: v.string(),
    startedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Obtener primer dispatcher disponible (o usar uno por defecto)
    const dispatcher = await ctx.db.query("dispatchers").first();
    if (!dispatcher) {
      throw new Error("No dispatcher found. Please seed dispatchers first.");
    }

    // Generar número de incidente
    const incidentNumber = `INC-2024-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;

    // Crear incidente en estado incoming_call
    const incidentId = await ctx.db.insert("incidents", {
      incidentNumber,
      status: "incoming_call",
      priority: "medium",
      location: {
        address: "", // Se llenará con AI
      },
      times: {
        callReceived: args.startedAt,
      },
      dispatcherId: dispatcher._id, // Temporal hasta que dispatcher acepte
    });

    // Crear call asociado
    const callId = await ctx.db.insert("calls", {
      twilioCallSid: args.twilioCallSid,
      incidentId,
      callerPhone: args.callerPhone,
      status: "ringing",
      startedAt: args.startedAt,
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
      incidentNumber,
      twilioCallSid: args.twilioCallSid,
    };
  },
});
```

## Cambios Necesarios en el Código

### 1. Exportar `addTranscriptionChunk` como `mutation`

**Archivo:** `convex/calls.ts`

Cambiar de `internalMutation` a `mutation` para que el backend pueda llamarla:

```typescript
// Cambiar esto:
export const addTranscriptionChunk = internalMutation({

// Por esto:
export const addTranscriptionChunk = mutation({
```

### 2. Crear `createIncomingCall` mutation

Agregar la mutation `createIncomingCall` en `convex/calls.ts` (ver código arriba).

### 3. Actualizar Backend para Usar las Mutations

El backend necesita actualizar `convex_db.py` para:

1. **Crear llamada entrante** al inicio:
   ```python
   def create_incoming_call(self, twilio_call_sid: str, caller_phone: str) -> dict:
       return self.client.mutation("calls:createIncomingCall", {
           "twilioCallSid": twilio_call_sid,
           "callerPhone": caller_phone,
           "startedAt": int(time.time() * 1000),
       })
   ```

2. **Agregar chunks de transcripción** durante la llamada:
   ```python
   def add_transcription_chunk(
       self, 
       call_id: str, 
       chunk_text: str, 
       offset: float,
       speaker: str = "caller"
   ) -> dict:
       return self.client.mutation("calls:addTranscriptionChunk", {
           "callId": call_id,
           "chunk": {
               "offset": offset,
               "speaker": speaker,  # "caller", "dispatcher", o "system"
               "text": chunk_text,
           },
       })
   ```

## Flujo Completo Integrado

```
1. Llamada Entrante (Twilio Webhook)
   ↓
   Backend: create_incoming_call()
   → Convex: calls:createIncomingCall
   → Crea: Call + Incident (status: incoming_call)
   ↓
   Frontend: Ve llamada entrante automáticamente (Convex subscription)

2. Dispatcher Acepta (Frontend)
   ↓
   Frontend: acceptCall mutation
   → Convex: incidents:acceptCall
   → Actualiza: Incident (status: confirmed, dispatcherId)
   ↓
   Backend: Continúa procesando audio

3. Audio Chunks Llegan (WebSocket)
   ↓
   Backend: process_audio_chunk() por cada chunk
   → Transcribe audio
   → Extrae datos (Claude)
   → Backend: add_transcription_chunk()
   → Convex: calls:addTranscriptionChunk
   → Actualiza: Call.transcriptionChunks
   ↓
   Frontend: Ve transcripción en tiempo real (Convex subscription)

4. Dispatcher Confirma Emergencia (Frontend)
   ↓
   Frontend: confirmEmergency mutation
   → Convex: incidents:confirmEmergency
   → Crea: IncidentAssignment (status: pending)
   ↓
   Rescuer App: Ve assignment automáticamente (Convex subscription)
```

## Próximos Pasos

1. ✅ Crear `calls:createIncomingCall` mutation
2. ✅ Cambiar `addTranscriptionChunk` de `internalMutation` a `mutation`
3. ⚠️ Actualizar backend para usar estas mutations
4. ⚠️ Probar flujo completo end-to-end

## Notas Importantes

- **Tiempo Real**: Convex maneja las actualizaciones automáticamente. No se necesitan WebSockets adicionales.
- **Speaker Detection**: El backend necesita detectar quién habla (caller vs dispatcher) para el campo `speaker`.
- **Offset**: El backend debe calcular el offset en segundos desde el inicio de la llamada.
- **Orden de Chunks**: Los chunks pueden llegar desordenados. La mutation los ordena automáticamente por `offset`.

