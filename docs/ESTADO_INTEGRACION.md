# Estado de Integración con Backend

**Fecha:** Enero 2025  
**Rama:** `feat/backend-integration`  
**Objetivo:** Preparar frontend para recibir datos del backend en tiempo real

---

## 🎯 Objetivo Principal

**Renderizar correctamente la información que se añade a la DB desde el backend.**

El backend está trabajando en:
- Transcripción en tiempo real (Azure Speech SDK)
- Extracción de datos estructurados (Claude AI)
- Integración con Convex

Nosotros nos encargamos de:
- ✅ Mostrar transcripción en tiempo real (sin diarización)
- ✅ Mostrar datos estructurados del incidente
- ✅ Actualización automática vía Convex subscriptions

---

## ✅ Cambios Realizados

### 1. Schema de Transcripción Actualizado

**Antes:** Transcripción diarizada por speakers (caller/dispatcher/system)  
**Ahora:** Transcripción continua sin diarización

```typescript
// Schema actualizado
transcriptionChunks: v.optional(
  v.array(
    v.object({
      offset: v.number(), // Tiempo en segundos desde inicio
      text: v.string(), // Texto del chunk (sin diarización)
    })
  )
)
```

**Razón:** El backend NO hace diarización, solo transcribe texto continuo.

### 2. Componente TranscriptionFeed Actualizado

- ✅ Muestra texto continuo sin separación por speakers
- ✅ Si hay `transcription` completo, lo muestra directamente
- ✅ Si hay `transcriptionChunks`, los muestra con timestamps
- ✅ Actualización automática cuando el backend añade chunks

### 3. Mutations Preparadas para Backend

- ✅ `calls:createIncomingCall` - Crear llamada entrante
- ✅ `calls:addTranscriptionChunk` - Agregar chunks de transcripción
- ✅ `calls:create` - Crear/actualizar call con transcripción completa
- ✅ `incidents:create` - Crear/actualizar incidente
- ✅ `patients:create` - Crear paciente

---

## 🔄 Flujo Esperado

### 1. Llamada Entrante
```
Backend recibe llamada Twilio
  ↓
Backend: calls:createIncomingCall()
  ↓
Convex: Crea Call + Incident (status: incoming_call)
  ↓
Frontend: Ve llamada entrante automáticamente
```

### 2. Transcripción en Tiempo Real
```
Backend recibe audio chunk
  ↓
Backend transcribe (Azure Speech SDK)
  ↓
Backend: calls:addTranscriptionChunk({ offset, text })
  ↓
Convex: Actualiza Call.transcriptionChunks y Call.transcription
  ↓
Frontend: Ve transcripción aparecer automáticamente
```

### 3. Datos Estructurados
```
Backend extrae datos con Claude AI
  ↓
Backend: incidents:create() o patients:create()
  ↓
Convex: Actualiza Incident/Patient
  ↓
Frontend: Ve datos estructurados actualizarse automáticamente
```

---

## 📋 Formato de Transcripción

### Chunks Incrementales

El backend debe llamar `calls:addTranscriptionChunk` con:

```typescript
{
  callId: "j975z58ekp84jqxdnzxga7va897vxtv0",
  chunk: {
    offset: 5.2, // Segundos desde inicio de llamada
    text: "Por favor ayuda, mi padre está teniendo un ataque al corazón..."
  }
}
```

**Nota:** NO incluir campo `speaker`. La transcripción es texto continuo.

### Texto Completo

El backend puede también actualizar `transcription` directamente:

```typescript
{
  callId: "j975z58ekp84jqxdnzxga7va897vxtv0",
  transcription: "Texto completo de la transcripción sin diarización..."
}
```

---

## 🚀 Próximos Pasos

### Inmediato
1. ⏳ Esperar que el backend actualice `main` con su schema de Convex
2. ⏳ Revisar schema del backend y adaptarnos si es necesario
3. ⏳ Probar con llamada real cuando el backend esté listo

### Después
1. Trabajar en que el frontend actualice cosas que muevan el app de rescatista
2. Integrar acciones del dispatcher que afecten al rescuer app

---

## 📝 Notas Importantes

- **Transcripción NO diarizada:** El backend NO separa por speakers, solo transcribe texto continuo
- **Actualización automática:** El frontend usa Convex subscriptions, no necesita polling
- **Schema flexible:** Estamos preparados para adaptarnos al schema que el backend actualice en `main`

---

## 🔗 Archivos Clave

- **Schema:** `/convex/schema.ts` - Transcripción sin speakers
- **Componente:** `/src/components/dispatcher/TranscriptionFeed.tsx` - Muestra texto continuo
- **Mutations:** `/convex/calls.ts` - `addTranscriptionChunk` sin speakers
- **Vista:** `/src/app/dispatcher/[id]/page.tsx` - Muestra transcripción en tiempo real

---

**Última actualización:** Después de cambiar transcripción a formato sin diarización.

