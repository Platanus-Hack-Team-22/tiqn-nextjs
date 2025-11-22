#!/bin/bash
# Script simplificado para copiar datos de prod a dev

set -e

echo "🔄 Copiando datos de producción a desarrollo..."
echo ""

# Guardar .env.local actual
if [ -f ".env.local" ]; then
  cp .env.local .env.local.backup
  echo "✅ Backup de .env.local guardado"
fi

# Paso 1: Leer de producción
echo "📖 Paso 1: Leyendo datos de producción..."
cat > .env.local << 'ENVEOF'
CONVEX_DEPLOYMENT=prod:festive-kiwi-66|eyJ2MiI6IjE3ZGMxYTMxNmUwYjRhOWNiYTFmNDRkYjU1MDI1OTk0In0=
NEXT_PUBLIC_CONVEX_URL=https://festive-kiwi-66.convex.cloud
ENVEOF

echo "   Leyendo datos..."
pnpx convex run readAll:getAllDispatchers > /tmp/dispatchers.json 2>&1
pnpx convex run readAll:getAllRescuers > /tmp/rescuers.json 2>&1
pnpx convex run readAll:getAllPatients > /tmp/patients.json 2>&1
pnpx convex run readAll:getAllIncidents > /tmp/incidents.json 2>&1
pnpx convex run readAll:getAllCalls > /tmp/calls.json 2>&1
pnpx convex run readAll:getAllIncidentAssignments > /tmp/assignments.json 2>&1
pnpx convex run readAll:getAppState > /tmp/app_state.json 2>&1

echo "✅ Datos leídos y guardados en /tmp/*.json"
echo ""

# Paso 2: Restaurar dev
echo "📝 Paso 2: Restaurando configuración de desarrollo..."
if [ -f ".env.local.backup" ]; then
  mv .env.local.backup .env.local
else
  echo "⚠️  No hay backup. Asegúrate de ejecutar 'pnpx convex dev' después."
  rm .env.local
fi

echo ""
echo "✅ Datos guardados en:"
echo "   - /tmp/dispatchers.json"
echo "   - /tmp/rescuers.json"
echo "   - /tmp/patients.json"
echo "   - /tmp/incidents.json"
echo "   - /tmp/calls.json"
echo "   - /tmp/assignments.json"
echo "   - /tmp/app_state.json"
echo ""
echo "📋 Siguiente paso: Ejecuta las mutations en desarrollo (ver README_COPY_PROD.md)"
