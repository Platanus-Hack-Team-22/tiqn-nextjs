# Checklist Pre-PR

## Cambios Pendientes a Commitear

### ✅ Cambios Modificados (staged)
- `convex/incidents.ts` - Actualizado `patientAge` a `v.float64()`
- `convex/simulate.ts` - Actualizado `offset` a `v.float64()`
- `src/app/dispatcher/[id]/page.tsx` - Usa `incident.fullTranscript` directamente
- `convex/_generated/api.d.ts` - Tipos generados actualizados

### 📝 Archivos Nuevos Útiles (agregar)
- `convex/readAll.ts` - Queries para leer todos los datos (útil para copiar prod->dev)
- `convex/seedFromProd.ts` - Mutations para poblar dev desde prod
- `scripts/copy-prod-to-dev-simple.sh` - Script para copiar datos
- `scripts/README_COPY_PROD.md` - Documentación del proceso
- `docs/PR_SUMMARY.md` - Resumen de la PR

### ❌ Archivos Temporales (NO agregar)
- `.env.local.backup` - Backup temporal
- `.env.local.prod` - Config temporal de prod
- `.gitignore.local` - Gitignore temporal
- `add-transcription.sh` - Script temporal
- `create-test-incident.sh` - Script temporal
- `create-test.sh` - Script temporal
- `test-prod-query.sh` - Script temporal
- `convex/addTranscription.ts` - Archivo temporal
- `convex/findIncident.ts` - Archivo temporal (ya existe en otro lugar)
- `.gitignore.additions` - Archivo temporal

### 🤔 Archivos a Revisar
- `convex/copyFromProd.ts` - Funciones para leer de prod (¿agregar o no?)
  - Son solo queries de lectura, útiles pero específicas para copiar datos
  - Decisión: Agregar, son útiles para desarrollo

## Comandos para Preparar el PR

```bash
# 1. Agregar cambios modificados
git add convex/incidents.ts convex/simulate.ts src/app/dispatcher/[id]/page.tsx convex/_generated/api.d.ts

# 2. Agregar archivos nuevos útiles
git add convex/readAll.ts convex/seedFromProd.ts scripts/ docs/PR_SUMMARY.md

# 3. Agregar copyFromProd (útil para desarrollo)
git add convex/copyFromProd.ts

# 4. Verificar qué se va a commitear
git status

# 5. Hacer commit
git commit -m "feat: Actualizar tipos a v.float64() y usar incident.fullTranscript

- Actualizar patientAge y offset a v.float64() para alinearse con schema de producción
- Frontend ahora usa incident.fullTranscript directamente con fallback a call.transcription
- Agregar funciones y scripts para copiar datos de producción a desarrollo
- Documentación de PR agregada"

# 6. Verificar que no haya errores
pnpm run check

# 7. Push a la rama
git push origin feat/backend-integration
```

## Verificaciones Finales

- [ ] No hay errores de linter (`pnpm run lint`)
- [ ] No hay errores de TypeScript (`pnpm run typecheck`)
- [ ] Build funciona (`pnpm run build`)
- [ ] Schema está alineado con producción
- [ ] Frontend renderiza correctamente
- [ ] Documentación actualizada

## Notas

- El error de `@twilio/voice-sdk` en `src/app/page.tsx` es del código de main (Twilio Voice Agent), no de nuestros cambios
- Los archivos temporales se pueden eliminar después del PR
- Los scripts en `scripts/` son útiles para desarrollo pero no críticos para producción

