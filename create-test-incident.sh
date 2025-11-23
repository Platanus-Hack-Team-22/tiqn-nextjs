#!/bin/bash
cd /Users/sat/code/platanus-hack-2/tiqn-nextjs
export CONVEX_DEPLOYMENT=prod:knowing-mouse-775
export NEXT_PUBLIC_CONVEX_URL=https://knowing-mouse-775.convex.cloud

# Primero desplegar funciones
echo "Desplegando funciones a producción..."
pnpx convex deploy --prod --once --typecheck=disable

# Obtener un dispatcherId primero
echo "Obteniendo dispatcher..."
DISPATCHER_ID=$(pnpx convex run --prod verification:getDispatchers | grep -o '"[^"]*"' | head -1 | tr -d '"')

if [ -z "$DISPATCHER_ID" ]; then
  echo "No hay dispatchers. Creando uno..."
  # Usar createOrUpdate para crear la incidencia (creará dispatcher si no existe)
  pnpx convex run --prod incidents:createOrUpdate '{"callSessionId":"test-prod-'$(date +%s)'","dispatcherId":"j97fc232q805afv2hatbnf5fxs7vwkpd","incidentType":"Test Incident Production","description":"Incidencia de prueba para verificar conexión con producción","address":"Av. Test 123, Santiago","district":"Santiago","priority":"medium"}'
else
  echo "Usando dispatcher: $DISPATCHER_ID"
  # Crear incidencia de test
  pnpx convex run --prod test:createTestIncident
fi

echo "Listo!"

