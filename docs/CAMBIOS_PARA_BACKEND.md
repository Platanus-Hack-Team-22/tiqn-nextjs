# Cambios Necesarios para Adaptarse al Backend

## Resumen

El backend espera ciertas mutations y queries que **NO tenemos** en nuestro código de Convex. Necesitamos crearlas para que el backend pueda funcionar correctamente.

---

## Mutations y Queries que el Backend Espera

### ❌ FALTANTES (Necesitamos Crear)

#### 1. `patients:create`
**Ubicación esperada:** `convex/patients.ts`  
**Uso del backend:** Crear registro de paciente cuando se extrae información del paciente

**Lo que espera el backend:**
```python
patient_id = self.client.mutation("patients:create", {
    "firstName": "Juan",
    "lastName": "Pérez",
    "age": 45,
    "sex": "M",
    "address": "Apoquindo 3000",
    "district": "Las Condes",
    "medications": ["Aspirina"],
    "allergies": ["Penicilina"],
    "medicalHistory": ["Hipertensión"],
    "notes": "...",
    "createdAt": 1234567890,
    "updatedAt": 1234567890,
})
```

**Necesitamos crear:** `convex/patients.ts` con mutation `create`

---

#### 2. `incidents:create`
**Ubicación esperada:** `convex/incidents.ts`  
**Uso del backend:** Crear incidente cuando termina la llamada

**⚠️ PROBLEMA:** El backend espera campos **planos** pero nuestro schema tiene `location` como **objeto**.

**Lo que espera el backend:**
```python
incident_id = self.client.mutation("incidents:create", {
    "status": "incoming_call",
    "priority": "medium",
    "incidentType": "Dolor en el pecho",
    "description": "...",
    "address": "Apoquindo 3000",  # ← Campo plano, NO objeto
    "district": "Las Condes",      # ← Campo plano
    "reference": "Cerca del mall", # ← Campo plano
    "dispatcherId": "...",
    "patientId": "...",
})
```

**Lo que tenemos en schema:**
```typescript
location: v.object({
  address: v.string(),
  district: v.optional(v.string()),
  reference: v.optional(v.string()),
})
```

**Solución:** Crear mutation que acepte campos planos y los convierta a objeto `location`.

---

#### 3. `calls:create`
**Ubicación esperada:** `convex/calls.ts`  
**Uso del backend:** Crear registro de llamada con transcripción completa

**Lo que espera el backend:**
```python
call_id = self.client.mutation("calls:create", {
    "incidentId": "...",
    "transcription": "Texto completo...",
    "transcriptionChunks": None,  # o array de chunks
    "createdAt": 1234567890,
})
```

**⚠️ PROBLEMA:** El backend envía `createdAt` pero nuestro schema tiene `startedAt` (requerido).

**Lo que tenemos en schema:**
```typescript
startedAt: v.number(),  // Requerido
```

**Solución:** La mutation debe mapear `createdAt` → `startedAt` o aceptar ambos.

---

#### 4. `system:now`
**Ubicación esperada:** `convex/system.ts`  
**Uso del backend:** Obtener timestamp del servidor

**Lo que espera el backend:**
```python
timestamp = self.client.query("system:now")
```

**Necesitamos crear:** `convex/system.ts` con query `now` que retorne `Date.now()`

---

#### 5. `incidents:get`
**Ubicación esperada:** `convex/incidents.ts`  
**Uso del backend:** Obtener incidente por ID

**Lo que espera el backend:**
```python
incident = self.client.query("incidents:get", {"id": "..."})
```

**Tenemos:** `getIncident` pero con argumento `incidentId`, no `id`

**Solución:** Crear `get` que acepte `id` o adaptar el backend.

---

#### 6. `incidents:listRecent`
**Ubicación esperada:** `convex/incidents.ts`  
**Uso del backend:** Listar incidentes recientes

**Lo que espera el backend:**
```python
incidents = self.client.query("incidents:listRecent", {"limit": 10})
```

**Tenemos:** `getRecentIncidents` con mismo nombre de argumento ✅

**Solución:** Crear alias `listRecent` o renombrar.

---

#### 7. `patients:get`
**Ubicación esperada:** `convex/patients.ts`  
**Uso del backend:** Obtener paciente por ID

**Lo que espera el backend:**
```python
patient = self.client.query("patients:get", {"id": "..."})
```

**Necesitamos crear:** `convex/patients.ts` con query `get`

---

#### 8. `incidents:createOrUpdate` (Opcional - para tiempo real)
**Ubicación esperada:** `convex/incidents.ts`  
**Uso del backend:** Actualizar incidente en tiempo real durante la llamada

**Lo que espera el backend:**
```python
incident_id = self.client.mutation("incidents:createOrUpdate", {
    "callSessionId": "...",
    "dispatcherId": "...",
    "priority": "medium",
    "patientName": "Juan Pérez",
    "address": "...",
    # ... muchos campos opcionales
})
```

**Nota:** Esta es para actualizaciones en tiempo real. Puede ser opcional si el backend solo guarda al final.

---

## Cambios Necesarios en el Schema

### ⚠️ NINGUNO - El schema está bien

El schema que tenemos coincide con el que espera el backend. Solo necesitamos crear las mutations/queries que faltan.

---

## Plan de Acción

### Prioridad Alta (Backend no funciona sin estas)

1. ✅ **Crear `convex/patients.ts`**
   - Mutation: `create`
   - Query: `get`

2. ✅ **Crear `convex/system.ts`**
   - Query: `now` → retorna `Date.now()`

3. ✅ **Crear `incidents:create` mutation**
   - Aceptar campos planos (`address`, `district`, `reference`)
   - Convertir a objeto `location` para guardar en DB
   - Manejar `times.callReceived` (requerido)

4. ✅ **Crear `calls:create` mutation**
   - Mapear `createdAt` → `startedAt`
   - Manejar `twilioCallSid` y `callerPhone` (requeridos)
   - Manejar `status` (requerido)

5. ✅ **Crear `incidents:get` query**
   - Aceptar argumento `id` (o adaptar backend)

6. ✅ **Crear `incidents:listRecent` query**
   - Alias de `getRecentIncidents` o renombrar

### Prioridad Media (Mejoras)

7. ⚠️ **Crear `incidents:createOrUpdate` mutation**
   - Para actualizaciones en tiempo real
   - Solo si el backend lo usa

---

## Estructura de Archivos a Crear

```
convex/
  ├── patients.ts          ← CREAR (create, get)
  ├── system.ts            ← CREAR (now)
  ├── incidents.ts         ← AGREGAR (create, get, listRecent, createOrUpdate)
  └── calls.ts             ← AGREGAR (create)
```

---

## Ejemplo de Implementación

### `convex/patients.ts`
```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    age: v.optional(v.number()),
    sex: v.optional(v.union(v.literal("M"), v.literal("F"), v.literal("Other"))),
    address: v.optional(v.string()),
    district: v.optional(v.string()),
    medications: v.optional(v.array(v.string())),
    allergies: v.optional(v.array(v.string())),
    medicalHistory: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { createdAt, updatedAt, ...patientData } = args;
    return await ctx.db.insert("patients", {
      ...patientData,
      medicalHistory: patientData.medicalHistory || [],
      medications: patientData.medications || [],
      allergies: patientData.allergies || [],
      createdAt,
      updatedAt,
    });
  },
});

export const get = query({
  args: { id: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

### `convex/system.ts`
```typescript
import { query } from "./_generated/server";

export const now = query({
  args: {},
  handler: async () => {
    return Date.now();
  },
});
```

### `convex/incidents.ts` - Agregar `create`
```typescript
export const create = mutation({
  args: {
    status: v.union(
      v.literal("incoming_call"),
      v.literal("confirmed"),
      v.literal("rescuer_assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    incidentType: v.optional(v.string()),
    description: v.optional(v.string()),
    // Campos planos que el backend envía
    address: v.string(),
    district: v.optional(v.string()),
    reference: v.optional(v.string()),
    dispatcherId: v.id("dispatchers"),
    patientId: v.optional(v.id("patients")),
  },
  handler: async (ctx, args) => {
    const { address, district, reference, ...rest } = args;
    
    // Generar número de incidente
    const incidentNumber = `INC-2024-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;

    return await ctx.db.insert("incidents", {
      incidentNumber,
      ...rest,
      location: {
        address,
        district: district ?? undefined,
        reference: reference ?? undefined,
      },
      times: {
        callReceived: Date.now(), // Requerido
      },
    });
  },
});

// Alias para compatibilidad con backend
export const get = query({
  args: { id: v.id("incidents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Reutilizar getRecentIncidents
    const allIncidents = await ctx.db.query("incidents").collect();
    const recentStatuses = ["completed", "cancelled"] as const;
    const limit = args.limit ?? 20;
    
    return allIncidents
      .filter((inc) => recentStatuses.includes(inc.status as typeof recentStatuses[number]))
      .slice(0, limit);
  },
});
```

### `convex/calls.ts` - Agregar `create`
```typescript
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
    createdAt: v.optional(v.number()), // Backend envía esto
    // También necesitamos los campos requeridos del schema
    twilioCallSid: v.optional(v.string()), // Si no viene, generar uno
    callerPhone: v.optional(v.string()),   // Si no viene, usar placeholder
    status: v.optional(v.union(
      v.literal("ringing"),
      v.literal("in_progress"),
      v.literal("on_hold"),
      v.literal("completed"),
      v.literal("failed")
    )),
  },
  handler: async (ctx, args) => {
    const { createdAt, ...callData } = args;
    
    return await ctx.db.insert("calls", {
      ...callData,
      twilioCallSid: callData.twilioCallSid || `CA${Math.random().toString(36).substring(2, 15)}`,
      callerPhone: callData.callerPhone || "+56900000000",
      status: callData.status || "in_progress",
      startedAt: createdAt || Date.now(), // Mapear createdAt → startedAt
    });
  },
});
```

---

## Resumen de Cambios

| Función | Estado | Acción |
|---------|--------|--------|
| `patients:create` | ✅ **Creada** | `convex/patients.ts` |
| `patients:get` | ✅ **Creada** | `convex/patients.ts` |
| `system:now` | ✅ **Creada** | `convex/system.ts` |
| `incidents:create` | ✅ **Creada** | `convex/incidents.ts` |
| `incidents:get` | ✅ **Creada** | Alias en `convex/incidents.ts` |
| `incidents:listRecent` | ✅ **Creada** | Alias en `convex/incidents.ts` |
| `calls:create` | ✅ **Creada** | `convex/calls.ts` |
| `calls:createIncomingCall` | ✅ Existe | Ya creada |
| `calls:addTranscriptionChunk` | ✅ Existe | Ya creada |

---

## Notas Importantes

1. **Campos Planos vs Objetos**: El backend envía `address`, `district`, `reference` como campos planos, pero nuestro schema tiene `location` como objeto. Las mutations deben hacer la conversión.

2. **Timestamps**: El backend envía `createdAt` pero nuestro schema usa `startedAt` para calls. Mapear correctamente.

3. **Campos Requeridos**: El schema requiere `twilioCallSid`, `callerPhone`, `status` en calls. Si el backend no los envía, generar valores por defecto.

4. **Compatibilidad**: Mantener las queries existentes (`getIncident`, `getRecentIncidents`) y crear aliases para compatibilidad con el backend.

---

## Próximos Pasos

1. Crear los archivos faltantes (`patients.ts`, `system.ts`)
2. Agregar mutations faltantes a archivos existentes
3. Probar que el backend pueda llamar todas las funciones
4. Documentar cualquier diferencia que encontremos

