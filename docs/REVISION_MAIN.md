# Revisión de Cambios en Main

**Fecha:** Enero 2025  
**Después de:** `git pull origin main` en ambos repositorios

---

## 📋 Cambios en tiqn-nextjs (main)

### Commits Recientes
- `87af23b` - Merge pull request #6: extra-info
- `13fc473` - add extra info to schema
- `fdb8ac6` - revive files
- `70f2b6e` - Merge pull request #5: convex_edits
- `096114a` - schema changes

### Archivos Modificados en Main (vs nuestra rama)
- `convex/init.ts` - Cambios en seed data
- `convex/schema.ts` - Cambios en schema (revisar diferencias)
- `convex/verification.ts` - Archivo nuevo
- `src/app/page.tsx` - Cambios en página principal

---

## 📋 Cambios en tiqn_backend (main)

### Commits Recientes
- `9388617` - Merge pull request #8: extra-info
- `09727dd` - add extra info to schema

### Archivos Modificados
- `core_api/src/core.py` - Mejoras en procesamiento de audio
- `core_api/src/services/convex_db.py` - Sin cambios significativos (ya tenía `update_incident_realtime`)
- `core_api/src/twilio_stream/routes.py` - Mejoras en manejo de WebSocket

### Funcionalidad del Backend

#### 1. WebSocket Handler (`twilio_stream/routes.py`)
- ✅ Recibe audio chunks de Twilio
- ✅ Procesa cada 5 segundos (CHUNK_SIZE)
- ✅ Llama a `process_audio_chunk()` con `dispatcher_id` hardcodeado
- ✅ Actualiza Convex en tiempo real (`update_convex=True`)

#### 2. Core Processing (`core.py`)
- ✅ Transcribe audio con Azure Speech SDK
- ✅ Extrae datos estructurados con Claude AI
- ✅ Llama a `convex.update_incident_realtime()` después de cada chunk
- ✅ Retorna resultado con `convex_update` incluido

#### 3. Convex Service (`convex_db.py`)
- ✅ `update_incident_realtime()` - Llama a `incidents:createOrUpdate`
- ✅ `save_emergency_call()` - Guarda al final de la llamada
- ✅ Usa `callSessionId` para identificar incidentes

---

## ✅ Lo que Ya Tenemos Implementado

### Mutations Creadas
- ✅ `incidents:createOrUpdate` - Para actualizaciones en tiempo real
- ✅ `incidents:create` - Para crear incidentes
- ✅ `calls:create` - Para crear calls
- ✅ `calls:addTranscriptionChunk` - Para chunks de transcripción
- ✅ `patients:create` - Para crear pacientes

### Schema
- ✅ Transcripción sin diarización (igual que main)
- ✅ Campos requeridos correctos
- ✅ Estructura de location correcta

---

## 🔍 Diferencias a Revisar

### 1. Schema (`convex/schema.ts`)
- Revisar si hay campos nuevos en main que no tenemos
- Verificar que la estructura de transcripción coincide

### 2. Init/Seed (`convex/init.ts`)
- Ver qué datos de seed hay en main
- Asegurar compatibilidad

### 3. Verification (`convex/verification.ts`)
- Archivo nuevo en main, revisar qué hace

---

## 🎯 Próximos Pasos

1. ✅ Revisar diferencias en schema
2. ✅ Asegurar que nuestra mutation `createOrUpdate` coincide con lo que el backend espera
3. ✅ Probar con datos reales de producción
4. ⚠️ Verificar si hay campos nuevos en main que necesitemos agregar

---

## 📝 Notas

- El backend está usando `callSessionId` para identificar incidentes
- El backend llama a `incidents:createOrUpdate` durante la llamada (no solo al final)
- El backend procesa audio cada 5 segundos y actualiza Convex en tiempo real
- El dispatcher_id está hardcodeado en el backend (temporal)

