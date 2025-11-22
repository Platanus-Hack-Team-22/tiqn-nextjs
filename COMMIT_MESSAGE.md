feat: Integración backend y migración dispatcher UI

## Cambios Principales

### Schema y Backend
- Actualizado schema a producción exacto con v.float64()
- dispatcherId ahora requerido en incidents
- Campos planos de ubicación (address, district, reference)
- Funciones defensivas que toleran datos antiguos en producción

### Frontend Dispatcher
- Migración completa de dispatcher.html a Next.js/React
- Dashboard con llamadas entrantes, incidentes activos e historial
- Vista de incidente en vivo con transcripción en tiempo real
- Soporte para incident.fullTranscript directamente desde el incidente

### Funciones Convex
- Queries defensivas para producción (getIncomingCalls, getActiveIncidents, etc.)
- Mutations compatibles con backend FastAPI (createOrUpdate)
- Soporte para transcripción diarizada (speaker: caller/dispatcher/system)
- Funciones y scripts para copiar datos de producción a desarrollo

### Utilidades
- Scripts de simulación para desarrollo
- Documentación completa de integración y estado
- Seed data actualizado

## Archivos Clave

- `convex/schema.ts` - Schema de producción
- `src/app/dispatcher/page.tsx` - Dashboard principal
- `src/app/dispatcher/[id]/page.tsx` - Vista de incidente
- `convex/incidents.ts` - Queries y mutations de incidentes
- `docs/PR_SUMMARY.md` - Resumen detallado

## Breaking Changes

- Schema: v.number() → v.float64() (requiere redeploy)
- dispatcherId ahora requerido en incidents
- Campos de ubicación ahora planos (no objeto anidado)

## Compatibilidad

- ✅ Compatible con datos antiguos en producción
- ✅ Compatible con backend FastAPI actual
- ✅ Compatible con schema de producción

