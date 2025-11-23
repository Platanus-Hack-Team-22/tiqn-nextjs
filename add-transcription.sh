#!/bin/bash

# Script para agregar transcripción al incidente de prueba
# callSessionId: test-prod-1763843278

cd "$(dirname "$0")"

echo "Buscando incidente por callSessionId..."
INCIDENT_ID=$(pnpx convex run incidents:get '{"id": "jh7fwz5r8wvnm8d54n01m90rkx7vw6dz"}' 2>/dev/null | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$INCIDENT_ID" ]; then
  echo "Error: No se pudo encontrar el incidente"
  exit 1
fi

echo "Incidente encontrado: $INCIDENT_ID"

echo "Buscando call asociado..."
CALL_ID=$(pnpx convex run calls:getCallByIncident "{\"incidentId\": \"$INCIDENT_ID\"}" 2>/dev/null | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CALL_ID" ]; then
  echo "Creando call nuevo..."
  CALL_ID=$(pnpx convex run calls:create "{\"incidentId\": \"$INCIDENT_ID\", \"transcriptionChunks\": []}" 2>/dev/null | grep -o '"[^"]*"' | head -1 | tr -d '"')
fi

if [ -z "$CALL_ID" ]; then
  echo "Error: No se pudo obtener o crear el call"
  exit 1
fi

echo "Call ID: $CALL_ID"
echo "Agregando chunks de transcripción..."

# Agregar chunks uno por uno
pnpx convex run calls:addTranscriptionChunk "{\"callId\": \"$CALL_ID\", \"chunk\": {\"offset\": 0, \"speaker\": \"system\", \"text\": \"Llamada conectada. Iniciando transcripción...\"}}"
pnpx convex run calls:addTranscriptionChunk "{\"callId\": \"$CALL_ID\", \"chunk\": {\"offset\": 2, \"speaker\": \"dispatcher\", \"text\": \"TIQN Emergency Dispatch. ¿Cuál es su emergencia?\"}}"
pnpx convex run calls:addTranscriptionChunk "{\"callId\": \"$CALL_ID\", \"chunk\": {\"offset\": 5, \"speaker\": \"caller\", \"text\": \"Por favor ayuda, creo que mi padre está teniendo un ataque al corazón.\"}}"
pnpx convex run calls:addTranscriptionChunk "{\"callId\": \"$CALL_ID\", \"chunk\": {\"offset\": 12, \"speaker\": \"dispatcher\", \"text\": \"Entendido. ¿Dónde se encuentra?\"}}"
pnpx convex run calls:addTranscriptionChunk "{\"callId\": \"$CALL_ID\", \"chunk\": {\"offset\": 15, \"speaker\": \"caller\", \"text\": \"Estamos en Av. Test 123, Santiago, departamento 4B.\"}}"
pnpx convex run calls:addTranscriptionChunk "{\"callId\": \"$CALL_ID\", \"chunk\": {\"offset\": 20, \"speaker\": \"dispatcher\", \"text\": \"¿Su padre está consciente? ¿Respira?\"}}"
pnpx convex run calls:addTranscriptionChunk "{\"callId\": \"$CALL_ID\", \"chunk\": {\"offset\": 23, \"speaker\": \"caller\", \"text\": \"Sí, está consciente pero tiene mucho dolor en el pecho. Respira con dificultad.\"}}"
pnpx convex run calls:addTranscriptionChunk "{\"callId\": \"$CALL_ID\", \"chunk\": {\"offset\": 30, \"speaker\": \"dispatcher\", \"text\": \"Perfecto. Estoy enviando una ambulancia. ¿Tiene alguna alergia o medicación conocida?\"}}"
pnpx convex run calls:addTranscriptionChunk "{\"callId\": \"$CALL_ID\", \"chunk\": {\"offset\": 35, \"speaker\": \"caller\", \"text\": \"Tiene alergia a la penicilina. Toma medicamentos para la presión arterial.\"}}"

echo "✅ Transcripción agregada exitosamente!"

