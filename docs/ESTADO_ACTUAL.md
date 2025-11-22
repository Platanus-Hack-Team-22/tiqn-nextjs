# Estado Actual del Proyecto TIQN - Migración Dispatcher

**Fecha:** Enero 2025  
**Estado:** En progreso - Migración de HTML a Next.js + Convex

---

## ✅ Lo que está COMPLETADO

### 1. Configuración Base

- ✅ **Tailwind CSS v4** configurado con colores personalizados `tiqn-*`
- ✅ **Fuente Inter** configurada en lugar de Geist
- ✅ **Animaciones personalizadas** (`pulse-critical`, `fade-in-up`, etc.)
- ✅ **Estilos globales** migrados del HTML original

### 2. Schema de Convex

- ✅ **Schema actualizado** para coincidir exactamente con `main` (tiqn repo)
- ✅ Todas las tablas definidas:
  - `patients` - Con `dateOfBirth` opcional
  - `dispatchers` - Con `email`, `isActive`, `createdAt` requeridos
  - `rescuers` - Con `email`, `status` union, `isActive`, `createdAt` requeridos
  - `incidents` - Con `times` requerido, `dispatcherId` requerido
  - `calls` - Con todos los campos requeridos (`twilioCallSid`, `callerPhone`, `status` union)
  - `incidentAssignments` - Con `rescuerId` requerido, `times` requerido
  - `incidentUpdates` - Para live feed de rescatistas
  - `patientMatches` - Para demo/judges

### 3. Queries de Convex

**Para Frontend:**
- ✅ `getIncomingCalls` - Obtiene incidentes con status `incoming_call`
- ✅ `getActiveIncidents` - Obtiene incidentes activos (`confirmed`, `rescuer_assigned`, `in_progress`)
- ✅ `getIncident` - Obtiene un incidente con todas sus relaciones
- ✅ `getRecentIncidents` - Obtiene historial (`completed`, `cancelled`)
- ✅ `getCallByIncident` - Obtiene call/transcripción por incidente

**Para Backend (compatibilidad):**
- ✅ `patients:get` - Obtener paciente por ID
- ✅ `incidents:get` - Obtener incidente por ID (alias)
- ✅ `incidents:listRecent` - Listar incidentes recientes (alias)
- ✅ `system:now` - Obtener timestamp del servidor

### 4. Mutations de Convex

**Para Frontend:**
- ✅ `acceptCall` - Dispatcher acepta una llamada entrante
  - Actualiza `dispatcherId` al dispatcher que acepta
  - Cambia status a `confirmed`
  - Actualiza `times.confirmed`
  - Actualiza call status a `in_progress`
- ✅ `confirmEmergency` - Crea `IncidentAssignment` en estado `pending`
  - Crea assignment con primer rescuer disponible (para simulación)
  - En producción, backend creará múltiples assignments

**Para Backend (creadas para integración):**
- ✅ `patients:create` - Crear paciente (acepta campos del backend)
- ✅ `incidents:create` - Crear incidente (acepta campos planos, convierte a objeto location)
- ✅ `calls:create` - Crear call (mapea createdAt → startedAt)
- ✅ `calls:createIncomingCall` - Crear llamada entrante desde Twilio
- ✅ `calls:addTranscriptionChunk` - Agregar chunks de transcripción en tiempo real

### 5. Funciones de Simulación

- ✅ `simulateIncomingCall` - Crea llamada entrante para testing
  - Crea `Call` con status `ringing`
  - Crea `Incident` con status `incoming_call`
  - Usa primer dispatcher disponible (requerido por schema)
- ✅ `simulateTranscriptionChunk` - Agrega chunks de transcripción progresivamente
  - Ordena chunks por `offset` automáticamente

### 6. Componentes UI

- ✅ `DispatcherHeader` - Header con logo y estado del sistema
- ✅ `IncidentCard` - Tarjeta de incidente para dashboard
- ✅ `PriorityBadge` - Badge de prioridad
- ✅ `TranscriptionFeed` - Feed de transcripción en tiempo real
  - Muestra chunks ordenados por `offset`
  - Diferencia entre caller/dispatcher/system
- ✅ `IncidentForm` - Formulario de datos estructurados (solo lectura por ahora)
  - Muestra datos de incidente, ubicación y paciente
  - Muestra historial médico y medicamentos
- ✅ `DispatchAlert` - Popup de alerta de dispatch

### 7. Rutas Next.js

- ✅ `/dispatcher` - Dashboard principal
  - Sección "Llamadas Entrantes" (roja, arriba)
  - Sección "Active Incidents" (incidentes en progreso)
  - Sección "Recent Activity" (historial)
- ✅ `/dispatcher/[id]` - Vista en vivo del incidente
  - Panel izquierdo: Transcripción en tiempo real
  - Panel derecho: Formulario de datos estructurados
  - Header con timer y controles
  - Popup de dispatch alert cuando está `confirmed`

### 8. Documentación

- ✅ `/docs/API_ENDPOINTS_REQUEST.md` - Documentación completa de endpoints para backend FastAPI
- ✅ `/docs/SIMULATION.md` - Guía de simulación para testing
- ✅ `/docs/SCHEMA_COMPARISON.md` - Comparación de schemas
- ✅ `/docs/BACKEND_INTEGRATION.md` - Cómo funciona la integración con backend
- ✅ `/docs/CAMBIOS_PARA_BACKEND.md` - Detalle técnico de cambios necesarios
- ✅ `/docs/RESUMEN_ADAPTACION_BACKEND.md` - Resumen de adaptaciones realizadas
- ✅ `/docs/ESTADO_PARA_EQUIPO.md` - Resumen ejecutivo para el equipo

### 9. Build y Linting

- ✅ TypeScript compila sin errores
- ✅ Build de producción pasa correctamente
- ✅ Linting corregido (usando `??` en lugar de `||`)
- ✅ Sin errores de ESLint

---

## ⚠️ Lo que está PENDIENTE o necesita REVISIÓN

### 1. Flujo de Aceptar Llamada

**Problema actual:**
- El schema requiere `dispatcherId` al crear un incidente
- Pero en el flujo real, cuando llega una llamada NO debería tener dispatcher asignado
- La simulación usa el primer dispatcher disponible como workaround

**Solución necesaria:**
- Opción A: Backend crea incidente con un dispatcher "sistema" o el dispatcher "on duty"
- Opción B: Ajustar schema para permitir `dispatcherId` opcional en `incoming_call` (pero esto no coincide con main)
- Opción C: Backend maneja la creación inicial y luego actualiza cuando dispatcher acepta

**Estado:** ⚠️ Necesita decisión del equipo sobre cómo manejar esto en producción

### 2. Dashboard - Llamadas Entrantes

**Estado actual:**
- ✅ Query `getIncomingCalls` creada
- ✅ Sección agregada al dashboard
- ⚠️ **Necesita verificación:** ¿Aparecen las llamadas entrantes correctamente?

**Para verificar:**
1. Ejecutar `pnpx convex run simulate:simulateIncomingCall`
2. Abrir `/dispatcher`
3. Verificar que aparece en sección "Llamadas Entrantes"

### 3. Aceptar Llamada Automáticamente

**Estado actual:**
- ✅ Mutation `acceptCall` creada
- ⚠️ **Falta:** Llamar automáticamente cuando dispatcher hace clic en incidente `incoming_call`

**Implementación necesaria:**
- En `/dispatcher/[id]/page.tsx`, detectar si `incident.status === "incoming_call"`
- Si es así, llamar automáticamente a `acceptCall` mutation
- Necesitamos obtener el `dispatcherId` del usuario actual (hardcodeado por ahora)

### 4. Botón "Confirmar Emergencia"

**Estado actual:**
- ✅ Mutation `confirmEmergency` creada
- ✅ Popup `DispatchAlert` creado
- ⚠️ **Falta:** Conectar el botón del popup con la mutation
- ⚠️ **Falta:** Mostrar popup solo cuando se puede confirmar (tiene datos suficientes)

**Implementación necesaria:**
- En `/dispatcher/[id]/page.tsx`, conectar botón "Dispatch" del popup
- Llamar a `confirmEmergency` mutation
- Manejar estados de loading y éxito

### 5. Transcripción en Tiempo Real

**Estado actual:**
- ✅ Componente `TranscriptionFeed` creado
- ✅ Ordena chunks por `offset`
- ✅ Convex subscriptions manejan actualizaciones automáticamente
- ⚠️ **Falta:** Verificar que los chunks aparecen en tiempo real cuando se agregan

**Para probar:**
```bash
pnpx convex run simulate:simulateTranscriptionChunk \
  --callId "<callId>" \
  --chunk '{"offset": 5, "speaker": "caller", "text": "Test..."}'
```

### 6. Tiempo Transcurrido

**Estado actual:**
- ⚠️ **Problema:** No hay campo `createdAt` en `incidents` schema
- Actualmente muestra "00:00" como placeholder
- El schema tiene `times.callReceived` que se puede usar

**Solución:**
- Usar `times.callReceived` para calcular tiempo transcurrido
- Actualizar `IncidentCard` y dashboard para mostrar tiempo real

### 7. Datos del Usuario (Dispatcher)

**Estado actual:**
- ⚠️ **Falta:** Obtener dispatcherId del usuario actual
- Actualmente hardcodeado o no implementado
- Necesario para `acceptCall` mutation

**Solución:**
- Implementar autenticación o contexto de usuario
- O usar un dispatcher hardcodeado para desarrollo

### 8. Manejo de Errores

**Estado actual:**
- ⚠️ **Falta:** Manejo de errores en mutations
- ⚠️ **Falta:** Mensajes de error al usuario
- ⚠️ **Falta:** Loading states en botones

### 9. Testing del Flujo Completo

**Flujo a probar:**
1. ✅ Simular llamada entrante
2. ⚠️ Verificar que aparece en dashboard
3. ⚠️ Hacer clic y verificar que acepta automáticamente
4. ⚠️ Agregar chunks de transcripción y verificar tiempo real
5. ⚠️ Confirmar emergencia y verificar que crea assignment
6. ⚠️ Verificar que rescatistas ven el assignment

---

## 🔧 Problemas Conocidos

### 0. Datos Antiguos en DB (URGENTE)

**Problema:** Hay incidentes en la base de datos que fueron creados antes de actualizar el schema y no tienen `dispatcherId` requerido.

**Error:** `Schema validation failed. Object is missing the required field dispatcherId`

**Solución temporal creada:**
- Mutation `incidents:fixOrphanedIncidents` para limpiar datos antiguos
- Asigna primer dispatcher a incidentes `incoming_call` sin dispatcher
- Elimina incidentes corruptos en otros estados

**Para ejecutar:**
```bash
pnpx convex run incidents:fixOrphanedIncidents
```

**Nota:** Esta función debe ejecutarse antes de que Convex dev pueda funcionar correctamente.

### 1. Schema vs Flujo Real

**Problema:** El schema requiere `dispatcherId` pero el flujo dice que no debería tenerlo inicialmente.

**Workaround actual:** Simulación usa primer dispatcher disponible.

**Solución a definir:** Cómo manejar esto en producción con el backend.

### 2. IncidentAssignment sin Rescuer

**Problema:** El schema requiere `rescuerId` pero en estado `pending` no debería tenerlo.

**Workaround actual:** Simulación usa primer rescuer disponible.

**Solución a definir:** En producción, backend creará múltiples assignments (uno por rescuer).

### 3. Tiempo Transcurrido

**Problema:** No hay `createdAt` en incidents, solo `times.callReceived`.

**Solución:** Usar `times.callReceived` para calcular tiempo transcurrido.

---

## 📋 Próximos Pasos Recomendados

### Prioridad Alta

1. **Verificar llamadas entrantes en dashboard**
   - Probar que aparecen después de simular
   - Verificar que se pueden hacer clic

2. **Implementar aceptar llamada automática**
   - Detectar `incoming_call` en vista en vivo
   - Llamar a `acceptCall` automáticamente
   - Obtener `dispatcherId` del usuario

3. **Conectar botón "Confirmar Emergencia"**
   - Conectar con mutation
   - Manejar estados de loading
   - Mostrar feedback al usuario

### Prioridad Media

4. **Calcular tiempo transcurrido**
   - Usar `times.callReceived`
   - Actualizar en tiempo real

5. **Mejorar manejo de errores**
   - Agregar try/catch en mutations
   - Mostrar mensajes al usuario
   - Loading states

6. **Testing completo del flujo**
   - Probar todo el flujo end-to-end
   - Verificar actualizaciones en tiempo real

### Prioridad Baja

7. **Optimizaciones de UI**
   - Mejorar animaciones
   - Agregar más feedback visual
   - Mejorar responsive design

8. **Documentación adicional**
   - Guía de deployment
   - Troubleshooting común

---

## 🧪 Cómo Probar Actualmente

### 1. Iniciar Servidores

```bash
# Terminal 1: Next.js
cd tiqn-nextjs
pnpm dev

# Terminal 2: Convex
cd tiqn-nextjs
pnpx convex dev
```

### 2. Simular Llamada Entrante

```bash
pnpx convex run simulate:simulateIncomingCall
```

**Resultado esperado:**
- Se crea `Call` y `Incident`
- Aparece en dashboard en "Llamadas Entrantes"

### 3. Agregar Transcripción

```bash
pnpx convex run simulate:simulateTranscriptionChunk \
  --callId "<callId_del_paso_anterior>" \
  --chunk '{"offset": 2, "speaker": "caller", "text": "Por favor ayuda..."}'
```

**Resultado esperado:**
- Chunk aparece en tiempo real en la vista en vivo

### 4. Verificar Dashboard

1. Abrir `http://localhost:3000/dispatcher`
2. Verificar sección "Llamadas Entrantes"
3. Hacer clic en incidente
4. Verificar que se abre vista en vivo
5. Verificar transcripción si agregaste chunks

---

## 📝 Notas Importantes

1. **Schema está alineado con main** - Cualquier cambio futuro debe reflejarse en ambos
2. **Simulación es temporal** - En producción, el backend manejará la creación inicial
3. **Convex maneja tiempo real** - No se necesitan WebSockets, las subscriptions son automáticas
4. **Build pasa correctamente** - Listo para producción cuando se complete el flujo
5. **Solo Dispatcher migrado** - Rescuer app aún no migrada (según instrucciones)

---

## 🔗 Archivos Clave

- **Schema:** `/convex/schema.ts`
- **Queries:** `/convex/incidents.ts`, `/convex/calls.ts`, `/convex/patients.ts`, `/convex/system.ts`
- **Mutations Backend:** `/convex/patients.ts`, `/convex/incidents.ts`, `/convex/calls.ts`
- **Simulación:** `/convex/simulate.ts`
- **Limpieza:** `/convex/cleanup.ts`
- **Dashboard:** `/src/app/dispatcher/page.tsx`
- **Vista en vivo:** `/src/app/dispatcher/[id]/page.tsx`
- **Componentes:** `/src/components/dispatcher/`, `/src/components/ui/`
- **Documentación:** `/docs/ESTADO_PARA_EQUIPO.md` (resumen para equipo), `/docs/BACKEND_INTEGRATION.md`

---

**Última actualización:** 
- ✅ Schema verificado: Idéntico a main (solo diferencia de línea en blanco)
- ✅ Todas las mutations para backend creadas (`patients:create`, `incidents:create`, `calls:create`, `system:now`)
- ✅ Adaptaciones realizadas: Campos planos → objeto location, createdAt → startedAt
- ✅ DB limpia y seed ejecutado
- ✅ Servidor Next.js reiniciado y funcionando
- ✅ Build pasa correctamente
- ✅ Documentación para equipo creada (`ESTADO_PARA_EQUIPO.md`)

