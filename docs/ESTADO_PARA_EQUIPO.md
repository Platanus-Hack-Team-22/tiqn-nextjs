# Estado Actual - Frontend Next.js (Para el Equipo)

**Fecha:** Enero 2025  
**Repositorio:** `tiqn-nextjs`  
**Estado:** ✅ Funcional - Listo para integración con backend

---

## 🎯 Lo que Tenemos Funcionando

### 1. Dashboard de Dispatcher ✅
- **Ruta:** `/dispatcher`
- **Funcionalidad:**
  - Muestra llamadas entrantes (`incoming_call`)
  - Muestra incidentes activos (`confirmed`, `rescuer_assigned`, `in_progress`)
  - Muestra historial (`completed`, `cancelled`)
  - Actualización en tiempo real (Convex subscriptions)

### 2. Vista en Vivo de Incidente ✅
- **Ruta:** `/dispatcher/[id]`
- **Funcionalidad:**
  - Acepta automáticamente la llamada al abrir
  - Muestra transcripción en tiempo real
  - Muestra datos estructurados del incidente
  - Timer funcionando
  - Popup de dispatch alert (cuando está `confirmed`)

### 3. Schema de Convex ✅
- **Estado:** Idéntico al de `main` (tiqn repo)
- **Tablas:** `patients`, `dispatchers`, `rescuers`, `incidents`, `calls`, `incidentAssignments`, `incidentUpdates`, `patientMatches`
- **Validación:** Todos los campos requeridos están definidos

### 4. Mutations y Queries ✅
- **Frontend:** Todas las queries necesarias para mostrar datos
- **Backend:** Todas las mutations que el backend necesita están creadas

---

## 🔌 Integración con Backend

### ✅ Lo que YA Funciona

El backend puede llamar estas funciones de Convex:

#### Mutations (Backend puede crear/actualizar)
- ✅ `patients:create` - Crear paciente
- ✅ `incidents:create` - Crear incidente (acepta campos planos del backend)
- ✅ `calls:create` - Crear call con transcripción
- ✅ `calls:createIncomingCall` - Crear llamada entrante
- ✅ `calls:addTranscriptionChunk` - Agregar chunks de transcripción en tiempo real
- ✅ `incidents:acceptCall` - Dispatcher acepta llamada
- ✅ `incidents:confirmEmergency` - Confirmar emergencia

#### Queries (Backend puede leer)
- ✅ `patients:get` - Obtener paciente
- ✅ `incidents:get` - Obtener incidente
- ✅ `incidents:listRecent` - Listar incidentes recientes
- ✅ `system:now` - Obtener timestamp

### 🔄 Adaptaciones Realizadas

1. **Campos Planos → Objeto Location**
   - El backend envía `address`, `district`, `reference` como campos planos
   - Nuestras mutations los convierten automáticamente a objeto `location`

2. **createdAt → startedAt**
   - El backend envía `createdAt`
   - Nuestras mutations lo mapean a `startedAt` (requerido por schema)

3. **Valores por Defecto**
   - Si el backend no envía campos requeridos (`twilioCallSid`, `callerPhone`, `status`), se generan automáticamente

---

## ⚠️ Lo que Necesitamos del Backend

### 1. Actualizar Transcripción en Tiempo Real

**Estado actual del backend:**
- ✅ Tiene transcripción funcionando (Azure Speech SDK)
- ⚠️ **NO está guardando chunks** en tiempo real (hay un TODO)

**Lo que necesitamos:**
Que el backend llame a `calls:addTranscriptionChunk` cada vez que recibe un chunk de transcripción:

```python
# En el backend, cuando llega un chunk de transcripción:
convex_client.mutation("calls:addTranscriptionChunk", {
    "callId": call_id,  # ID del call creado
    "chunk": {
        "offset": offset_seconds,  # Tiempo desde inicio de llamada
        "speaker": "caller",  # o "dispatcher" o "system"
        "text": chunk_text
    }
})
```

**Resultado:** El frontend verá la transcripción aparecer en tiempo real automáticamente (gracias a Convex subscriptions).

---

### 2. Crear Llamada Entrante al Inicio

**Estado actual del backend:**
- ✅ Tiene función `create_incoming_call` en `convex_db.py`
- ⚠️ **NO está siendo llamada** cuando llega una llamada de Twilio

**Lo que necesitamos:**
Que cuando llegue una llamada de Twilio, el backend llame a `calls:createIncomingCall`:

```python
# Cuando llega llamada de Twilio:
result = convex_client.mutation("calls:createIncomingCall", {
    "twilioCallSid": twilio_call_sid,
    "callerPhone": caller_phone,
    "startedAt": int(time.time() * 1000)
})

# Esto crea:
# - Un Call con status "ringing"
# - Un Incident con status "incoming_call"
# - El frontend lo ve automáticamente en el dashboard
```

---

### 3. Actualizar Incidente con Datos de AI

**Estado actual del backend:**
- ✅ Tiene función `update_incident_realtime` en `convex_db.py`
- ⚠️ **NO está siendo llamada** durante la llamada

**Lo que necesitamos:**
Que después de cada chunk procesado, el backend actualice el incidente con los datos extraídos por Claude:

```python
# Después de procesar cada chunk:
convex_client.mutation("incidents:create", {
    "status": "incoming_call",
    "priority": "medium",  # o "low", "high", "critical"
    "incidentType": canonical.motivo,
    "description": "...",
    "address": f"{canonical.direccion} {canonical.numero}",
    "district": canonical.comuna,
    "reference": canonical.ubicacion_referencia,
    "dispatcherId": dispatcher_id,
    "patientId": patient_id  # si se creó paciente
})
```

**Nota:** Esta mutation acepta campos planos y los convierte automáticamente a objeto `location`.

---

## 📋 Flujo Esperado (End-to-End)

### 1. Llamada Entrante
```
Twilio → Backend recibe llamada
  ↓
Backend: calls:createIncomingCall()
  ↓
Convex: Crea Call + Incident (status: incoming_call)
  ↓
Frontend: Ve llamada entrante automáticamente en dashboard
```

### 2. Dispatcher Acepta
```
Frontend: Usuario hace clic en llamada entrante
  ↓
Frontend: incidents:acceptCall() automáticamente
  ↓
Convex: Actualiza Incident (status: confirmed, dispatcherId)
  ↓
Frontend: Muestra vista en vivo del incidente
```

### 3. Transcripción en Tiempo Real
```
Backend: Recibe audio chunk de Twilio
  ↓
Backend: Transcribe (Azure Speech)
  ↓
Backend: calls:addTranscriptionChunk()
  ↓
Convex: Actualiza Call.transcriptionChunks
  ↓
Frontend: Ve transcripción aparecer en tiempo real
```

### 4. Datos Estructurados
```
Backend: Extrae datos con Claude AI
  ↓
Backend: incidents:create() o patients:create()
  ↓
Convex: Actualiza Incident/Patient
  ↓
Frontend: Ve datos estructurados actualizarse automáticamente
```

### 5. Confirmar Emergencia
```
Frontend: Dispatcher hace clic en "Confirmar Emergencia"
  ↓
Frontend: incidents:confirmEmergency()
  ↓
Convex: Crea IncidentAssignment (status: pending)
  ↓
Rescuer App: Ve assignment automáticamente
```

---

## 🧪 Cómo Probar Actualmente

### Simulación Local (Sin Backend)

```bash
# 1. Crear llamada entrante
pnpx convex run simulate:simulateIncomingCall

# 2. Agregar transcripción progresivamente
pnpx convex run simulate:simulateTranscriptionChunk \
  '{"callId": "<callId>", "chunk": {"offset": 2, "speaker": "caller", "text": "..."}}'

# 3. Ver en frontend
# Abrir http://localhost:3000/dispatcher
```

### Con Backend Real

1. Backend llama `calls:createIncomingCall` cuando llega llamada
2. Backend llama `calls:addTranscriptionChunk` por cada chunk
3. Frontend se actualiza automáticamente (no necesita hacer nada)

---

## 📊 Estado de Archivos

### Convex Functions

| Archivo | Funciones | Estado |
|---------|-----------|--------|
| `convex/patients.ts` | `create`, `get` | ✅ Creado |
| `convex/system.ts` | `now` | ✅ Creado |
| `convex/incidents.ts` | `create`, `get`, `listRecent`, `getIncomingCalls`, `getActiveIncidents`, `getIncident`, `acceptCall`, `confirmEmergency` | ✅ Completo |
| `convex/calls.ts` | `create`, `createIncomingCall`, `addTranscriptionChunk`, `getCallByIncident` | ✅ Completo |
| `convex/schema.ts` | Schema completo | ✅ Idéntico a main |

### Frontend Components

| Componente | Estado | Descripción |
|------------|--------|-------------|
| `DispatcherHeader` | ✅ | Header con logo y estado |
| `IncidentCard` | ✅ | Tarjeta de incidente |
| `TranscriptionFeed` | ✅ | Feed de transcripción en tiempo real |
| `IncidentForm` | ✅ | Formulario de datos estructurados |
| `DispatchAlert` | ✅ | Popup de alerta |

### Rutas Next.js

| Ruta | Estado | Descripción |
|------|--------|-------------|
| `/dispatcher` | ✅ | Dashboard principal |
| `/dispatcher/[id]` | ✅ | Vista en vivo del incidente |

---

## 🐛 Problemas Conocidos

### 1. Hydration Error (Resuelto)
- **Problema:** `new Date()` causaba mismatch servidor/cliente
- **Solución:** Usar `useState` + `useEffect` para tiempo en cliente

### 2. Datos Antiguos en DB (Resuelto)
- **Problema:** Incidentes sin `dispatcherId` causaban errores de validación
- **Solución:** Función `cleanup:clearAllData` para limpiar DB

---

## ✅ Checklist de Integración

### Frontend (Nosotros)
- ✅ Schema alineado con main
- ✅ Mutations para backend creadas
- ✅ Queries para frontend funcionando
- ✅ Dashboard mostrando datos
- ✅ Vista en vivo funcionando
- ✅ Transcripción en tiempo real funcionando
- ✅ Aceptar llamada automática funcionando

### Backend (Equipo Backend)
- ⚠️ Llamar `calls:createIncomingCall` cuando llega llamada
- ⚠️ Llamar `calls:addTranscriptionChunk` por cada chunk de transcripción
- ⚠️ Llamar `incidents:create` cuando termina la llamada (o durante)
- ⚠️ Llamar `patients:create` si hay datos de paciente

---

## 📝 Resumen Ejecutivo

### Lo que Funciona
✅ Frontend completo y funcional  
✅ Schema correcto y validado  
✅ Todas las mutations que el backend necesita están creadas  
✅ Actualización en tiempo real funcionando  
✅ Dashboard y vista en vivo funcionando  

### Lo que Necesitamos del Backend
⚠️ Que llamen las mutations cuando corresponda:
- `calls:createIncomingCall` al inicio de llamada
- `calls:addTranscriptionChunk` por cada chunk
- `incidents:create` cuando termina (o durante)
- `patients:create` si hay datos de paciente

### Próximos Pasos
1. Backend integra las mutations en su código
2. Probamos con llamada real de Twilio
3. Verificamos que todo funciona end-to-end

---

## 🔗 Documentación Adicional

- `/docs/CAMBIOS_PARA_BACKEND.md` - Detalle técnico de cambios
- `/docs/RESUMEN_ADAPTACION_BACKEND.md` - Resumen de adaptaciones
- `/docs/BACKEND_INTEGRATION.md` - Cómo funciona la integración
- `/docs/ESTADO_ACTUAL.md` - Estado detallado del proyecto

---

**Última actualización:** Después de crear todas las mutations para backend y limpiar DB.

