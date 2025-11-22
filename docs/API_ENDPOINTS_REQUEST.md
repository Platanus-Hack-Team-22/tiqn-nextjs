# Documentación de Solicitud de Endpoints - Backend FastAPI

## Contexto

Este documento describe los endpoints que el backend FastAPI necesita implementar para integrarse con el sistema TIQN. El frontend usa **Convex** como base de datos reactiva, por lo que muchos endpoints solo necesitan actualizar la base de datos y el frontend se actualizará automáticamente.

## Arquitectura

- **Frontend**: Next.js + Convex (actualización en tiempo real)
- **Backend**: FastAPI que actualiza Convex directamente
- **Base de datos**: Convex (actualización reactiva automática)
- **Comunicación**: El backend actualiza Convex → Frontend se actualiza automáticamente

## Flujo del Sistema

1. **Llamada entrante** → Backend crea `Call` y `Incident` (status: `incoming_call`)
2. **Dispatcher acepta** → Backend actualiza `Incident` (status: `confirmed`) e inicia llamada Twilio
3. **Transcripción en tiempo real** → Backend actualiza `Call.transcriptionChunks` incrementalmente
4. **Claude/AI rellena datos** → Backend actualiza `Incident` con datos extraídos
5. **Dispatcher confirma emergencia** → Backend crea `IncidentAssignment` (status: `pending`)
6. **Rescuer acepta** → Backend actualiza `IncidentAssignment` (status: `accepted`)
7. **Rescuer completa** → Backend actualiza `Incident` (status: `completed`)

---

## Endpoints Requeridos

### 1. Crear Llamada Entrante

**POST** `/api/calls/incoming`

Cuando llega una llamada nueva (webhook de Twilio o similar).

**Request Body:**
```json
{
  "callerPhone": "+56912345678",
  "twilioCallSid": "CAxxxxx",
  "startedAt": 1763827304995
}
```

**Response:**
```json
{
  "callId": "j97841tqtrjk3yr2kjaxxap1zn7vwv92",
  "incidentId": "jn7aq21dv37bjejd7q5b7v3f9s7vx6cg",
  "incidentNumber": "INC-2024-0892"
}
```

**Acción en Convex:**
- Crear `Call` con status `in_progress`
- Crear `Incident` con:
  - `status: "incoming_call"`
  - `times.callReceived: timestamp`
  - `dispatcherId: null` (se asignará cuando un dispatcher acepte)

**Nota**: El frontend mostrará automáticamente el nuevo incidente en el dashboard cuando se cree.

---

### 2. Dispatcher Acepta Llamada

**POST** `/api/incidents/{incidentId}/accept`

Cuando un dispatcher hace clic en un incidente para atenderlo.

**Request Body:**
```json
{
  "dispatcherId": "jd75d5t1dvfgthz8c0hd5sj2f57vx6qs"
}
```

**Response:**
```json
{
  "success": true,
  "incidentId": "jn7aq21dv37bjejd7q5b7v3f9s7vx6cg"
}
```

**Acción en Convex:**
- Actualizar `Incident`:
  - `dispatcherId: dispatcherId`
  - `times.confirmed: timestamp`
- Iniciar llamada Twilio (si aplica)
- El frontend automáticamente mostrará la vista en vivo del incidente

---

### 3. Actualizar Transcripción (Chunk Incremental)

**POST** `/api/calls/{callId}/transcription-chunk`

Cuando llega un nuevo chunk de transcripción desde Twilio/Azure.

**Request Body:**
```json
{
  "chunk": {
    "offset": 5.2,
    "speaker": "caller",
    "text": "Por favor ayuda, mi padre está teniendo un ataque al corazón..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "chunkIndex": 3
}
```

**Acción en Convex:**
- Agregar chunk a `Call.transcriptionChunks` array
- El frontend automáticamente mostrará el nuevo chunk en tiempo real

**Nota**: Los chunks pueden llegar en cualquier orden, deben ordenarse por `offset`.

---

### 4. Actualizar Transcripción Completa

**POST** `/api/calls/{callId}/transcription-complete`

Cuando la transcripción completa está disponible (opcional, para casos batch).

**Request Body:**
```json
{
  "transcription": "Texto completo de la transcripción...",
  "chunks": [
    {"offset": 0, "speaker": "system", "text": "Call started."},
    {"offset": 2, "speaker": "dispatcher", "text": "TIQN Emergency Dispatch..."},
    {"offset": 5, "speaker": "caller", "text": "Por favor ayuda..."}
  ]
}
```

**Response:**
```json
{
  "success": true
}
```

**Acción en Convex:**
- Actualizar `Call.transcription` y `Call.transcriptionChunks`

---

### 5. AI Extrae Datos del Incidente

**POST** `/api/incidents/{incidentId}/extract-data`

Cuando Claude/AI ha procesado la transcripción y extraído datos estructurados.

**Request Body:**
```json
{
  "incidentType": "Cardiac Arrest Protocol",
  "location": {
    "address": "Av. Apoquindo 4500, Las Condes",
    "city": "Santiago",
    "district": "Las Condes",
    "coordinates": {
      "lat": -33.410,
      "lng": -70.568
    }
  },
  "patient": {
    "firstName": "Roberto",
    "lastName": "Soto",
    "age": 65,
    "sex": "M",
    "medicalHistory": ["Hypertension"],
    "medications": ["Lisinopril 10mg"]
  },
  "priority": "critical"
}
```

**Response:**
```json
{
  "success": true,
  "patientId": "js75hbkepq6wn2athwcpx4qj9n7vwyrf"
}
```

**Acción en Convex:**
- Crear o actualizar `Patient` si no existe
- Actualizar `Incident` con:
  - `incidentType`
  - `location` (completo)
  - `patientId`
  - `priority`
- El frontend automáticamente mostrará los datos en el formulario

**Nota**: Este endpoint puede llamarse múltiples veces mientras se procesa la transcripción.

---

### 6. Dispatcher Confirma Emergencia

**POST** `/api/incidents/{incidentId}/confirm-emergency`

Cuando el dispatcher hace clic en "Confirmar Emergencia" para notificar a rescatistas.

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "assignmentId": "jxxxxx",
  "availableRescuers": 2
}
```

**Acción en Convex:**
- Actualizar `Incident.status: "confirmed"`
- Crear `IncidentAssignment` con:
  - `incidentId`
  - `rescuerId: null` (vacío hasta que un rescuer acepte)
  - `status: "pending"`
  - `times.offered: timestamp`
- El frontend automáticamente mostrará el incidente como disponible para rescatistas

---

### 7. Rescuer Acepta Emergencia

**POST** `/api/incidents/{incidentId}/assign-rescuer`

Cuando un rescuer acepta una emergencia disponible.

**Request Body:**
```json
{
  "rescuerId": "jx71wcsgsp2nyppcvn1wj87jph7vxy86"
}
```

**Response:**
```json
{
  "success": true,
  "assignmentId": "jxxxxx"
}
```

**Acción en Convex:**
- Actualizar `IncidentAssignment`:
  - `rescuerId: rescuerId`
  - `status: "accepted"`
  - `times.accepted: timestamp`
- Actualizar `Incident`:
  - `status: "rescuer_assigned"`
  - `times.rescuerAssigned: timestamp`
- El frontend automáticamente actualizará el estado en ambas apps

---

### 8. Rescuer Marca como Completado

**POST** `/api/incidents/{incidentId}/complete`

Cuando el rescuer llega y completa el incidente.

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "success": true
}
```

**Acción en Convex:**
- Actualizar `Incident`:
  - `status: "completed"`
  - `times.completed: timestamp`
- El frontend automáticamente moverá el incidente al historial

---

### 9. Actualizar Ubicación del Rescuer (Opcional)

**POST** `/api/rescuers/{rescuerId}/location`

Para tracking en tiempo real del rescuer (opcional, si se implementa GPS).

**Request Body:**
```json
{
  "lat": -33.408,
  "lng": -70.565,
  "lastUpdated": 1763829917318
}
```

**Response:**
```json
{
  "success": true
}
```

**Acción en Convex:**
- Actualizar `Rescuer.currentLocation`

---

## Endpoints NO Necesarios (Convex maneja automáticamente)

Los siguientes endpoints **NO son necesarios** porque Convex actualiza el frontend automáticamente:

- ❌ `GET /api/incidents` - Usar `api.incidents.getActiveIncidents` en Convex
- ❌ `GET /api/incidents/{id}` - Usar `api.incidents.getIncident` en Convex
- ❌ `GET /api/calls/{id}/transcription` - Usar `api.calls.getCallByIncident` en Convex
- ❌ WebSockets para actualizaciones - Convex subscriptions manejan esto automáticamente

---

## Autenticación

**Nota**: Definir método de autenticación (API keys, JWT, etc.) según requerimientos del equipo.

---

## Ejemplo de Integración con Convex

El backend debe usar el SDK de Convex para actualizar la base de datos:

```python
from convex import ConvexClient

convex = ConvexClient("https://your-deployment.convex.cloud")

# Ejemplo: Crear llamada entrante
def create_incoming_call(caller_phone, twilio_sid):
    call_id = convex.mutation("calls:create", {
        "callerPhone": caller_phone,
        "twilioCallSid": twilio_sid,
        "status": "in_progress",
        "startedAt": int(time.time() * 1000)
    })
    
    incident_id = convex.mutation("incidents:create", {
        "incidentNumber": generate_incident_number(),
        "status": "incoming_call",
        "priority": "medium",
        "dispatcherId": None,  # Se asignará después
        "times": {
            "callReceived": int(time.time() * 1000)
        },
        "location": {
            "address": ""  # Se llenará con AI
        }
    })
    
    return {"callId": call_id, "incidentId": incident_id}
```

---

## Prioridades

### Alta Prioridad (MVP):
1. ✅ Crear llamada entrante
2. ✅ Dispatcher acepta llamada
3. ✅ Actualizar transcripción (chunks)
4. ✅ AI extrae datos
5. ✅ Confirmar emergencia
6. ✅ Rescuer acepta

### Media Prioridad:
7. Actualizar transcripción completa
8. Rescuer completa incidente

### Baja Prioridad:
9. Actualizar ubicación rescuer

---

## Notas Importantes

1. **Tiempo Real**: Convex maneja las actualizaciones en tiempo real automáticamente. No se necesitan WebSockets.

2. **Transcripción Incremental**: Los chunks pueden llegar desordenados. Ordenar por `offset` antes de mostrar.

3. **Estados del Incidente**: 
   - `incoming_call` → Llamada entrante, ningún dispatcher asignado
   - `confirmed` → Dispatcher aceptó, emergencia confirmada, esperando rescuer
   - `rescuer_assigned` → Rescuer aceptó, en camino
   - `in_progress` → Rescuer en escena
   - `completed` → Incidente completado
   - `cancelled` → Cancelado

4. **Manejo de Errores**: Todos los endpoints deben retornar errores HTTP estándar con mensajes descriptivos.

5. **Idempotencia**: Los endpoints deben ser idempotentes cuando sea posible (especialmente para actualizaciones de transcripción).

