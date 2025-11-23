#!/bin/bash
# Test script para verificar conexión a producción

echo "Probando conexión a producción..."
echo ""

echo "1. Dispatchers (readAll):"
pnpx convex run readAll:getAllDispatchers 2>&1 | jq 'length' 2>/dev/null || pnpx convex run readAll:getAllDispatchers 2>&1 | tail -3

echo ""
echo "2. Incidents (readAll):"
pnpx convex run readAll:getAllIncidents 2>&1 | jq 'length' 2>/dev/null || pnpx convex run readAll:getAllIncidents 2>&1 | tail -3

echo ""
echo "3. Incoming calls (incidents:getIncomingCalls):"
pnpx convex run incidents:getIncomingCalls 2>&1 | jq 'length' 2>/dev/null || pnpx convex run incidents:getIncomingCalls 2>&1 | tail -3
