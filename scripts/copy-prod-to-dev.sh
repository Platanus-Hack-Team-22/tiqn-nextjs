#!/bin/bash
# Script para copiar datos de producción a desarrollo
# IMPORTANTE: Solo lee de prod y escribe en dev, nunca modifica producción

set -e

echo "🔄 Copiando datos de producción a desarrollo..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "convex/schema.ts" ]; then
  echo "❌ Error: Debes ejecutar este script desde el directorio raíz del proyecto"
  exit 1
fi

# Paso 1: Leer datos de producción
echo -e "${BLUE}📖 Paso 1: Leyendo datos de producción (SOLO LECTURA)...${NC}"

# Guardar .env.local actual
if [ -f ".env.local" ]; then
  cp .env.local .env.local.backup
fi

# Configurar temporalmente para producción
cat > .env.local << 'ENVEOF'
CONVEX_DEPLOYMENT=prod:festive-kiwi-66|eyJ2MiI6IjE3ZGMxYTMxNmUwYjRhOWNiYTFmNDRkYjU1MDI1OTk0In0=
NEXT_PUBLIC_CONVEX_URL=https://festive-kiwi-66.convex.cloud
ENVEOF

echo "   Conectado a producción para leer datos..."

# Leer datos usando pnpx convex run (solo lectura)
echo "   Leyendo dispatchers..."
DISPATCHERS=$(pnpx convex run copyFromProd:getProdDispatchers 2>/dev/null || echo "[]")

echo "   Leyendo rescuers..."
RESCUERS=$(pnpx convex run copyFromProd:getProdRescuers 2>/dev/null || echo "[]")

echo "   Leyendo patients..."
PATIENTS=$(pnpx convex run copyFromProd:getProdPatients 2>/dev/null || echo "[]")

echo "   Leyendo incidents..."
INCIDENTS=$(pnpx convex run copyFromProd:getProdIncidents 2>/dev/null || echo "[]")

echo "   Leyendo calls..."
CALLS=$(pnpx convex run copyFromProd:getProdCalls 2>/dev/null || echo "[]")

echo "   Leyendo assignments..."
ASSIGNMENTS=$(pnpx convex run copyFromProd:getProdIncidentAssignments 2>/dev/null || echo "[]")

echo "   Leyendo app state..."
APP_STATE=$(pnpx convex run copyFromProd:getProdAppState 2>/dev/null || echo "null")

echo -e "${GREEN}✅ Datos leídos de producción${NC}"
echo ""

# Paso 2: Restaurar .env.local a dev
echo -e "${BLUE}📝 Paso 2: Cambiando a desarrollo...${NC}"

# Restaurar backup si existe, sino crear uno nuevo para dev
if [ -f ".env.local.backup" ]; then
  mv .env.local.backup .env.local
else
  cat > .env.local << 'ENVEOF'
# Convex Development Environment
# This file will be automatically updated by 'pnpx convex dev'
ENVEOF
fi

echo "   Verificando conexión a desarrollo..."
if ! grep -q "CONVEX_DEPLOYMENT" .env.local || grep -q "prod:" .env.local; then
  echo -e "${YELLOW}⚠️  No hay deployment de desarrollo configurado.${NC}"
  echo "   Ejecuta 'pnpx convex dev' primero para crear un deployment de desarrollo."
  exit 1
fi

echo -e "${GREEN}✅ Conectado a desarrollo${NC}"
echo ""

# Paso 3: Poblar desarrollo
echo -e "${BLUE}📝 Paso 3: Poblando desarrollo con datos de producción...${NC}"
echo ""
echo -e "${YELLOW}⚠️  NOTA: Este paso requiere que las funciones seedFromProd estén desplegadas en dev.${NC}"
echo "   Ejecuta 'pnpx convex deploy' primero si es necesario."
echo ""

# Guardar datos en archivos temporales para pasarlos a las mutations
echo "$DISPATCHERS" > /tmp/dispatchers.json
echo "$RESCUERS" > /tmp/rescuers.json
echo "$PATIENTS" > /tmp/patients.json
echo "$INCIDENTS" > /tmp/incidents.json
echo "$CALLS" > /tmp/calls.json
echo "$ASSIGNMENTS" > /tmp/assignments.json
echo "$APP_STATE" > /tmp/app_state.json

echo "   Los datos se han guardado en archivos temporales."
echo "   Ahora ejecuta manualmente las siguientes mutations en dev:"
echo ""
echo "   1. pnpx convex run seedFromProd:seedDispatchers < /tmp/dispatchers.json"
echo "   2. pnpx convex run seedFromProd:seedRescuers < /tmp/rescuers.json"
echo "   3. pnpx convex run seedFromProd:seedPatients < /tmp/patients.json"
echo "   4. pnpx convex run seedFromProd:seedIncidents < /tmp/incidents.json"
echo "   5. pnpx convex run seedFromProd:seedCalls < /tmp/calls.json"
echo "   6. pnpx convex run seedFromProd:seedIncidentAssignments < /tmp/assignments.json"
echo "   7. pnpx convex run seedFromProd:seedAppState < /tmp/app_state.json"
echo ""
echo -e "${GREEN}✅ Script completado. Sigue las instrucciones arriba para poblar dev.${NC}"

