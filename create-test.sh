#!/bin/bash
cd /Users/sat/code/platanus-hack-2/tiqn-nextjs
export CONVEX_DEPLOYMENT=prod:knowing-mouse-775
export NEXT_PUBLIC_CONVEX_URL=https://knowing-mouse-775.convex.cloud

# Obtener dispatcher primero
echo "Obteniendo dispatcher..."
DISPATCHERS=$(pnpx convex run --prod verification:getDispatchers 2>&1)
echo "$DISPATCHERS"

# Extraer el primer dispatcher ID (formato aproximado)
DISPATCHER_ID=$(echo "$DISPATCHERS" | grep -o '"[a-z0-9]*"' | head -1 | tr -d '"')

if [ -z "$DISPATCHER_ID" ] || [ "$DISPATCHER_ID" = "_creationTime" ]; then
  echo "No hay dispatchers válidos. Creando uno primero..."
  # Crear dispatcher primero
  pnpx convex run --prod dispatchers:create '{"name":"Test Dispatcher","phone":"+56900000000"}'
  sleep 2
  DISPATCHERS=$(pnpx convex run --prod verification:getDispatchers 2>&1)
  DISPATCHER_ID=$(echo "$DISPATCHERS" | grep -o '"[a-z0-9]*"' | head -1 | tr -d '"')
fi

echo "Usando dispatcher ID: $DISPATCHER_ID"

# Crear incidencia de test usando createOrUpdate
TIMESTAMP=$(date +%s)
JSON_PAYLOAD="{\"callSessionId\":\"test-prod-$TIMESTAMP\",\"dispatcherId\":\"$DISPATCHER_ID\",\"incidentType\":\"Test Incident Production\",\"description\":\"Incidencia de prueba para verificar conexión con producción\",\"address\":\"Av. Test 123, Santiago\",\"district\":\"Santiago\",\"priority\":\"medium\"}"

echo "Creando incidencia de test..."
pnpx convex run --prod incidents:createOrUpdate "$JSON_PAYLOAD"

echo "Listo! Verifica en http://localhost:3000/dispatcher"

