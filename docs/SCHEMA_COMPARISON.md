# Comparación de Schema: Main vs tiqn-nextjs

## Estado Actual

✅ **Schema actualizado para coincidir con main**

### Diferencias Corregidas

1. **`incidents.dispatcherId`**: Ahora es **requerido** (como en main)
   - **Nota**: Para `incoming_call`, la simulación usa el primer dispatcher disponible
   - En producción, el backend manejará la creación inicial

2. **`incidentAssignments.rescuerId`**: Ahora es **requerido** (como en main)
   - **Nota**: Para `pending`, la simulación usa el primer rescuer disponible
   - En producción, el backend creará múltiples assignments (uno por rescuer disponible)

### Tablas Idénticas

- ✅ `patients` - Idéntico
- ✅ `dispatchers` - Idéntico (email, isActive, createdAt requeridos)
- ✅ `rescuers` - Idéntico (email, status union, isActive, createdAt requeridos)
- ✅ `incidents` - Idéntico (times requerido, dispatcherId requerido)
- ✅ `calls` - Idéntico (twilioCallSid, callerPhone, status union requeridos)
- ✅ `incidentAssignments` - Idéntico (rescuerId requerido, times requerido)
- ✅ `incidentUpdates` - Idéntico
- ✅ `patientMatches` - Idéntico

## Flujo de Simulación vs Producción

### Simulación (Testing Local)

Cuando ejecutas `simulateIncomingCall`:
1. Obtiene el primer dispatcher disponible
2. Crea incidente con `dispatcherId` asignado (requerido por schema)
3. Crea call asociado
4. El incidente aparece en "Llamadas Entrantes"
5. Cuando otro dispatcher hace clic, se actualiza el `dispatcherId`

### Producción (Backend Real)

Cuando llega una llamada real:
1. Backend crea `Call` primero
2. Backend crea `Incident` con `dispatcherId` del dispatcher que está "on duty" o sistema
3. Cuando un dispatcher específico acepta, se actualiza `dispatcherId`
4. El incidente aparece en "Llamadas Entrantes" para todos los dispatchers

## Qué Debería Pasar Después de Simular

Cuando ejecutas `pnpx convex run simulate:simulateIncomingCall`:

1. ✅ Se crea un `Call` con status `ringing`
2. ✅ Se crea un `Incident` con status `incoming_call`
3. ✅ El incidente debería aparecer en el dashboard en la sección **"Llamadas Entrantes"**
4. ✅ Al hacer clic en el incidente, se llama automáticamente a `acceptCall` mutation
5. ✅ El incidente cambia a status `confirmed` y aparece en "Active Incidents"
6. ✅ La transcripción se actualiza en tiempo real cuando agregas chunks

## Verificación

Para verificar que todo funciona:

1. **Ejecutar simulación:**
   ```bash
   pnpx convex run simulate:simulateIncomingCall
   ```

2. **Abrir dashboard:** `http://localhost:3000/dispatcher`
   - Deberías ver la llamada entrante en la sección roja "Llamadas Entrantes"

3. **Hacer clic en la llamada:**
   - Debería abrir la vista en vivo
   - El status debería cambiar a `confirmed`
   - Debería aparecer en "Active Incidents"

4. **Agregar transcripción:**
   ```bash
   pnpx convex run simulate:simulateTranscriptionChunk \
     --callId "<callId>" \
     --chunk '{"offset": 2, "speaker": "caller", "text": "Por favor ayuda..."}'
   ```
   - Los chunks deberían aparecer en tiempo real en la vista en vivo

