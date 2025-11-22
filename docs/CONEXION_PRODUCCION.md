# Conexión a Convex de Producción

**Fecha:** Enero 2025

---

## ✅ Schema Actualizado

El schema local ahora coincide **exactamente** con el schema de producción:

- ✅ Usa `v.float64()` en lugar de `v.number()` (como en producción)
- ✅ `incidents`: Campos planos de location (`address`, `district`, `reference`), sin `incidentNumber`, sin `times`
- ✅ `calls`: Solo `incidentId`, `transcription`, `transcriptionChunks` (con `speaker`)
- ✅ `dispatchers`: Solo `name`, `phone` (opcional)
- ✅ `rescuers`: Solo `name`, `phone`, `stats` (opcional)
- ✅ `incidentAssignments`: `times` es opcional

---

## 🔌 Configuración de Producción

### Variables de Entorno (`.env.local`)

```bash
CONVEX_DEPLOYMENT=prod:knowing-mouse-775|eyJ2MiI6Ijg2ZmQ0ZDNhYjRkMjQ3ODZhNDFmZDlhMTJjMDU2Nzk3In0=
NEXT_PUBLIC_CONVEX_URL=https://knowing-mouse-775.convex.cloud
```

**✅ Conectado a producción**

---

## ⚠️ Datos Antiguos en Producción

Hay datos antiguos en producción que tienen campos que ya no existen en el schema:

- `calls` con campos: `callerPhone`, `startedAt`, `status`, `twilioCallSid`
- Estos campos no están en el schema nuevo

**Solución:** El backend debe limpiar estos datos antiguos o actualizarlos para que coincidan con el schema nuevo.

---

## ✅ Verificación de Conexión

### 1. Verificar que el servidor está corriendo
```bash
curl http://localhost:3000/dispatcher
```

### 2. Verificar conexión a Convex
- Abrir `http://localhost:3000/dispatcher`
- Debería mostrar datos de la base de datos de producción
- Si hay datos en producción, deberían aparecer automáticamente

### 3. Verificar actualización en tiempo real
- Los datos se actualizan automáticamente vía Convex subscriptions
- No necesitas refrescar la página
- Cuando el backend añade datos, aparecen automáticamente

---

## 🔄 Flujo de Datos en Tiempo Real

```
Backend (FastAPI) → Convex (Producción)
  ↓
Convex Subscriptions (WebSockets)
  ↓
Frontend (Local) → Muestra datos automáticamente
```

**No necesitas:**
- ❌ Polling
- ❌ Refresh manual
- ❌ WebSockets adicionales

**Convex maneja todo automáticamente** con sus subscriptions reactivas.

---

## 🐛 Troubleshooting

### Problema: Schema validation failed
**Error:** `Object contains extra field X that is not in the validator`

**Solución:**
1. Limpiar datos antiguos que no coinciden con el schema (desde el backend)
2. Verificar que el schema local coincide con producción ✅ (ya hecho)

### Problema: No veo datos
1. Verificar que `.env.local` tiene la URL correcta de producción ✅ (ya configurado)
2. Verificar que el servidor Next.js está corriendo
3. Verificar que Convex está conectado: `pnpx convex dev --once`
4. Revisar consola del navegador para errores

### Problema: Errores de TypeScript
```bash
# Regenerar tipos de Convex
pnpx convex dev --once --typecheck=disable
```

---

## 📝 Notas Importantes

- **Schema de Producción:** El código ahora coincide exactamente con el schema de producción
- **Transcripción:** Los chunks tienen `speaker` (caller/dispatcher/system)
- **Location:** Campos planos (`address`, `district`, `reference`), no objeto
- **Sin incidentNumber:** Se usa `_id.slice(-8)` como identificador visual
- **Sin times:** Se usa `lastUpdated` para calcular duración de llamada
- **Tipos numéricos:** Usa `v.float64()` como en producción

---

**Última actualización:** Después de actualizar schema para coincidir exactamente con producción y configurar conexión.
