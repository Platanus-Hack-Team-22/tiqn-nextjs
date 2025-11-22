# Simulación de Llamadas para Testing

Este documento explica cómo simular llamadas entrantes y transcripciones para testing local sin necesidad de estar en producción.

## Funciones de Simulación Disponibles

### 1. Simular Llamada Entrante

Crea un nuevo `Call` y `Incident` en estado `incoming_call`:

```bash
pnpx convex run simulate:simulateIncomingCall
```

Con número de teléfono personalizado:

```bash
pnpx convex run simulate:simulateIncomingCall --callerPhone "+56987654321"
```

**Resultado:**
- Crea un `Incident` con status `incoming_call`
- Crea un `Call` asociado con status `ringing`
- El incidente aparecerá automáticamente en el dashboard de dispatchers

### 2. Simular Chunk de Transcripción

Agrega un nuevo chunk de transcripción a una llamada existente:

```bash
pnpx convex run simulate:simulateTranscriptionChunk \
  --callId "j97841tqtrjk3yr2kjaxxap1zn7vwv92" \
  --chunk '{"offset": 5, "speaker": "caller", "text": "Por favor ayuda..."}'
```

**Nota:** Los chunks se ordenan automáticamente por `offset` antes de guardarse.

## Flujo de Testing Completo

### Paso 1: Crear Llamada Entrante

```bash
pnpx convex run simulate:simulateIncomingCall
```

Esto creará:
- Un incidente en estado `incoming_call` (aparece en dashboard)
- Un call asociado con status `ringing`

### Paso 2: Dispatcher Acepta la Llamada

En el frontend, cuando un dispatcher hace clic en el incidente, se llama automáticamente a `acceptCall` mutation, que:
- Asigna el dispatcher al incidente
- Cambia el status a `confirmed`
- Actualiza `times.confirmed`

### Paso 3: Simular Transcripción Progresiva

Agregar chunks de transcripción uno por uno:

```bash
# Chunk 1: Dispatcher
pnpx convex run simulate:simulateTranscriptionChunk \
  --callId "<callId>" \
  --chunk '{"offset": 2, "speaker": "dispatcher", "text": "TIQN Emergency Dispatch. State your emergency."}'

# Chunk 2: Caller
pnpx convex run simulate:simulateTranscriptionChunk \
  --callId "<callId>" \
  --chunk '{"offset": 5, "speaker": "caller", "text": "Por favor ayuda, creo que mi padre está teniendo un ataque al corazón..."}'

# Chunk 3: Dispatcher
pnpx convex run simulate:simulateTranscriptionChunk \
  --callId "<callId>" \
  --chunk '{"offset": 10, "speaker": "dispatcher", "text": "Mantén la calma. ¿Cuál es tu ubicación exacta?"}'

# Continuar agregando chunks...
```

**Nota:** El frontend se actualizará automáticamente gracias a las subscriptions de Convex.

### Paso 4: Confirmar Emergencia

En el frontend, cuando el dispatcher hace clic en "Confirmar Emergencia", se crea un `IncidentAssignment` en estado `pending`, que será visible para los rescatistas.

## Script de Testing Rápido

Puedes crear un script simple para simular una llamada completa:

```bash
#!/bin/bash

# Crear llamada entrante
RESULT=$(pnpx convex run simulate:simulateIncomingCall)
CALL_ID=$(echo $RESULT | jq -r '.callId')
INCIDENT_ID=$(echo $RESULT | jq -r '.incidentId')

echo "Call ID: $CALL_ID"
echo "Incident ID: $INCIDENT_ID"

# Agregar chunks progresivamente
pnpx convex run simulate:simulateTranscriptionChunk \
  --callId "$CALL_ID" \
  --chunk '{"offset": 2, "speaker": "dispatcher", "text": "TIQN Emergency Dispatch. State your emergency."}'

sleep 2

pnpx convex run simulate:simulateTranscriptionChunk \
  --callId "$CALL_ID" \
  --chunk '{"offset": 5, "speaker": "caller", "text": "Por favor ayuda, creo que mi padre está teniendo un ataque al corazón..."}'

# Continuar...
```

## Verificación

Después de ejecutar las simulaciones, puedes verificar en el dashboard:

1. **Llamadas Entrantes**: Deberían aparecer incidentes con status `incoming_call`
2. **Transcripción**: Los chunks deberían aparecer en tiempo real en la vista en vivo
3. **Actualizaciones**: Todo se actualiza automáticamente gracias a Convex subscriptions

## Notas Importantes

1. **Tiempo Real**: Convex maneja las actualizaciones en tiempo real automáticamente. No necesitas refrescar la página.

2. **Orden de Chunks**: Los chunks se ordenan automáticamente por `offset` antes de guardarse, pero es mejor enviarlos en orden.

3. **Testing en Producción**: Para testing con llamadas reales de Twilio, necesitas estar en producción. Usa estas funciones de simulación para desarrollo local.

4. **Limpiar Datos**: Puedes eliminar incidentes de prueba directamente desde el dashboard de Convex si necesitas limpiar.

