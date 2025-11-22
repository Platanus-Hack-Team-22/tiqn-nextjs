# Pull Request: Integración Backend y Migración Dispatcher UI

## Resumen

Esta PR integra el frontend de Next.js con el backend de FastAPI/Convex, migra la UI del dispatcher desde HTML a React/Next.js, y actualiza el schema de Convex para alinearse con producción.

## Cambios Principales

### 1. Schema de Convex Actualizado
- ✅ Actualizado a schema de producción exacto
- ✅ Todos los números ahora usan `v.float64()` en lugar de `v.number()`
- ✅ Agregada tabla `app_state` para estado global
- ✅ `dispatcherId` es requerido (no opcional) en incidents
- ✅ Campos planos de ubicación (address, district, reference) en lugar de objeto anidado

### 2. Frontend Dispatcher
- ✅ Migración completa de `dispatcher.html` a Next.js/React
- ✅ Dashboard de dispatcher (`/dispatcher`) con lista de llamadas entrantes, incidentes activos e historial
- ✅ Vista de incidente en vivo (`/dispatcher/[id]`) con transcripción en tiempo real
- ✅ Componentes reutilizables: `DispatcherHeader`, `IncidentCard`, `PriorityBadge`, `TranscriptionFeed`, `IncidentForm`
- ✅ Soporte para `fullTranscript` directamente desde el incidente (no solo desde call)

### 3. Funciones de Convex
- ✅ `incidents:getIncomingCalls` - Obtiene llamadas entrantes (defensiva para producción)
- ✅ `incidents:getActiveIncidents` - Obtiene incidentes activos
- ✅ `incidents:getIncident` - Obtiene un incidente con relaciones
- ✅ `incidents:getRecentIncidents` - Historial de incidentes
- ✅ `incidents:acceptCall` - Acepta una llamada entrante
- ✅ `incidents:confirmEmergency` - Confirma emergencia y crea assignment
- ✅ `incidents:createOrUpdate` - Crea o actualiza incidente (para backend)
- ✅ `calls:addTranscriptionChunk` - Agrega chunks de transcripción
- ✅ `patients:create`, `system:now` - Para integración con backend

### 4. Integración con Backend
- ✅ Mutations compatibles con el backend de FastAPI
- ✅ Manejo de campos planos del backend (no anidados)
- ✅ Soporte para transcripción diarizada (speaker: caller/dispatcher/system)
- ✅ Funciones defensivas que toleran datos antiguos en producción

### 5. Utilidades y Scripts
- ✅ `convex/simulate.ts` - Simulación de llamadas para desarrollo
- ✅ `convex/init.ts` - Seed data actualizado
- ✅ Scripts para copiar datos de producción a desarrollo (solo lectura de prod)

## Archivos Nuevos

### Componentes Frontend
- `src/app/dispatcher/page.tsx` - Dashboard principal
- `src/app/dispatcher/[id]/page.tsx` - Vista de incidente en vivo
- `src/components/dispatcher/TranscriptionFeed.tsx` - Feed de transcripción
- `src/components/dispatcher/IncidentForm.tsx` - Formulario de datos del incidente
- `src/components/dispatcher/DispatchAlert.tsx` - Alerta de dispatch
- `src/components/ui/DispatcherHeader.tsx` - Header reutilizable
- `src/components/ui/IncidentCard.tsx` - Tarjeta de incidente
- `src/components/ui/PriorityBadge.tsx` - Badge de prioridad

### Funciones Convex
- `convex/incidents.ts` - Queries y mutations de incidentes (expandido)
- `convex/calls.ts` - Manejo de llamadas y transcripciones
- `convex/patients.ts` - CRUD de pacientes
- `convex/system.ts` - Utilidades del sistema
- `convex/simulate.ts` - Simulación para desarrollo
- `convex/readAll.ts` - Queries para leer todos los datos (para copiar prod->dev)
- `convex/seedFromProd.ts` - Mutations para poblar dev desde prod

### Documentación
- `docs/API_ENDPOINTS_REQUEST.md` - Endpoints propuestos para FastAPI
- `docs/BACKEND_INTEGRATION.md` - Guía de integración con backend
- `docs/ESTADO_ACTUAL.md` - Estado actual del proyecto
- `docs/SIMULATION.md` - Cómo simular llamadas
- `docs/SCHEMA_COMPARISON.md` - Comparación de schemas
- Y más documentación de estado e integración

## Archivos Modificados

- `convex/schema.ts` - Schema completo actualizado a producción
- `convex/init.ts` - Seed data actualizado
- `src/app/page.tsx` - Página principal (Twilio Voice Agent de main)
- `src/styles/globals.css` - Estilos globales con colores TIQN

## Archivos Eliminados

- `convex/tasks.ts` - Tabla que no existe en schema de producción

## Testing

- ✅ Schema validado contra producción
- ✅ Queries defensivas que toleran datos antiguos
- ✅ Frontend renderiza correctamente `fullTranscript` desde incidente
- ✅ Simulación de llamadas funciona localmente

## Notas Importantes

1. **Producción**: Las queries son defensivas y no fallan con datos antiguos
2. **Desarrollo**: Scripts disponibles para copiar datos de prod a dev (solo lectura)
3. **Backend**: Mutations compatibles con estructura esperada por FastAPI
4. **Schema**: Alineado exactamente con producción usando `v.float64()`

## Próximos Pasos

- [ ] Rescuer app migration (futuro)
- [ ] Tests automatizados
- [ ] Optimizaciones de performance
- [ ] Mejoras de UX basadas en feedback

## Breaking Changes

- Schema cambió de `v.number()` a `v.float64()` - requiere redeploy
- `dispatcherId` ahora es requerido en incidents (antes era opcional temporalmente)
- Campos de ubicación ahora son planos (no objeto anidado)

## Compatibilidad

- ✅ Compatible con datos antiguos en producción (queries defensivas)
- ✅ Compatible con backend FastAPI actual
- ✅ Compatible con schema de producción

