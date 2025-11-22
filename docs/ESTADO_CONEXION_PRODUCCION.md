# Estado de Conexión a Producción

**Fecha:** Enero 2025

---

## ✅ Configuración Actual

### Variables de Entorno (`.env.local`)

```bash
CONVEX_DEPLOYMENT=prod:knowing-mouse-775
NEXT_PUBLIC_CONVEX_URL=https://knowing-mouse-775.convex.cloud
```

**✅ Conectado a producción**

---

## ✅ Schema Actualizado

El schema local ahora coincide con el schema de `main`:

- ✅ Usa `v.number()` en lugar de `v.float64()` (como en main)
- ✅ `incidents`: Campos planos de location, sin `incidentNumber`, sin `times`
- ✅ `calls`: Solo `incidentId`, `transcription`, `transcriptionChunks` (con `speaker`)
- ✅ `rescuers`: Tiene `currentLocation` opcional
- ✅ `incidentAssignments`: `rescuerId` es opcional, `status` incluye "completed"

---

## ✅ Mutations Actualizadas

### `incidents:createOrUpdate`
- ✅ `callSessionId` es **requerido** (como en main)
- ✅ Usa índice `by_session` para buscar incidentes existentes
- ✅ Crea o actualiza según corresponda

### `incidents:create`
- ✅ Ahora es un alias de `createOrUpdate` (como en main)

### Nuevas Queries (como en main)
- ✅ `incidents:getBySession` - Obtener incidente por `callSessionId`
- ✅ `incidents:listRecent` - Listar incidentes recientes (ordenados desc)

---

## ✅ Incidencia de Test Creada

Se creó una incidencia de prueba en producción:

- **ID:** `jh7fwz5r8wvnm8d54n01m90rkx7vw6dz`
- **Status:** `incoming_call`
- **Tipo:** "Test Incident Production"
- **Ubicación:** "Av. Test 123, Santiago"

**Para crear más incidencias de test:**
```bash
cd /Users/sat/code/platanus-hack-2/tiqn-nextjs
./create-test.sh
```

---

## 🔍 Verificación

### 1. Verificar que el servidor está corriendo
```bash
curl http://localhost:3000/dispatcher
```

### 2. Verificar conexión a Convex producción
- Abrir `http://localhost:3000/dispatcher`
- Debería mostrar la incidencia de test en "Llamadas Entrantes"
- Si no aparece, verificar consola del navegador

### 3. Verificar que las funciones están desplegadas
```bash
pnpx convex deploy --prod --once
```

---

## 📝 Notas

- **Servidor Next.js:** Debe reiniciarse después de cambiar `.env.local` para que lea las nuevas variables
- **Funciones Convex:** Deben desplegarse a producción con `pnpx convex deploy --prod`
- **Datos antiguos:** Hay datos antiguos en producción con campos inválidos, pero las queries manejan errores correctamente

---

**Última actualización:** Después de crear incidencia de test en producción.

