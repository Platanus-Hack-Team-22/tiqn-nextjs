# Copiar Datos de Producción a Desarrollo

Este proceso copia todos los datos de producción a tu deployment de desarrollo **sin modificar producción en absoluto**.

## ⚠️ IMPORTANTE

- **SOLO LEE** de producción
- **SOLO ESCRIBE** en desarrollo
- **NUNCA** modifica producción

## Prerrequisitos

1. Tener un deployment de desarrollo configurado:
   ```bash
   pnpx convex dev
   ```
   Esto creará/actualizará tu `.env.local` con `CONVEX_DEPLOYMENT` y `NEXT_PUBLIC_CONVEX_URL` para desarrollo.

2. Desplegar las funciones necesarias en desarrollo:
   ```bash
   pnpx convex deploy --prod false
   ```
   O simplemente ejecuta `pnpx convex dev` que despliega automáticamente.

## Proceso Manual (Recomendado)

### Paso 1: Leer datos de producción

Temporalmente configura `.env.local` para producción:

```bash
cat > .env.local << 'EOF'
CONVEX_DEPLOYMENT=prod:festive-kiwi-66|eyJ2MiI6IjE3ZGMxYTMxNmUwYjRhOWNiYTFmNDRkYjU1MDI1OTk0In0=
NEXT_PUBLIC_CONVEX_URL=https://festive-kiwi-66.convex.cloud
EOF
```

Luego lee los datos (guarda los outputs en archivos):

```bash
pnpx convex run copyFromProd:getProdDispatchers > /tmp/dispatchers.json
pnpx convex run copyFromProd:getProdRescuers > /tmp/rescuers.json
pnpx convex run copyFromProd:getProdPatients > /tmp/patients.json
pnpx convex run copyFromProd:getProdIncidents > /tmp/incidents.json
pnpx convex run copyFromProd:getProdCalls > /tmp/calls.json
pnpx convex run copyFromProd:getProdIncidentAssignments > /tmp/assignments.json
pnpx convex run copyFromProd:getProdAppState > /tmp/app_state.json
```

### Paso 2: Cambiar a desarrollo

Restaura tu `.env.local` de desarrollo (o ejecuta `pnpx convex dev` de nuevo):

```bash
# Tu .env.local debería tener algo como:
# CONVEX_DEPLOYMENT=dev:tu-deployment-name|token
# NEXT_PUBLIC_CONVEX_URL=https://tu-deployment.convex.cloud
```

### Paso 3: Poblar desarrollo

Ejecuta las mutations en orden (importante mantener las relaciones de IDs):

```bash
# 1. Dispatchers (primero, porque incidents los necesitan)
pnpx convex run seedFromProd:seedDispatchers "$(cat /tmp/dispatchers.json)"

# 2. Rescuers (necesarios para assignments)
pnpx convex run seedFromProd:seedRescuers "$(cat /tmp/rescuers.json)"

# 3. Patients (necesarios para incidents)
pnpx convex run seedFromProd:seedPatients "$(cat /tmp/patients.json)"

# 4. Incidents (necesitan dispatchers y patients)
pnpx convex run seedFromProd:seedIncidents "$(cat /tmp/incidents.json)"

# 5. Calls (necesitan incidents)
pnpx convex run seedFromProd:seedCalls "$(cat /tmp/calls.json)"

# 6. Assignments (necesitan incidents y rescuers)
pnpx convex run seedFromProd:seedIncidentAssignments "$(cat /tmp/assignments.json)"

# 7. App State (opcional)
pnpx convex run seedFromProd:seedAppState "$(cat /tmp/app_state.json)"
```

## Notas

- Las mutations `seedFromProd:*` mapean automáticamente los IDs antiguos a los nuevos
- El orden es importante: primero las tablas sin dependencias (dispatchers, rescuers, patients), luego las que dependen de ellas
- Si hay errores, verifica que todas las funciones estén desplegadas en desarrollo

## Verificación

Después de copiar, verifica que los datos estén en desarrollo:

```bash
pnpx convex run copyFromProd:getProdDispatchers  # Debería mostrar los dispatchers en dev
pnpx convex run copyFromProd:getProdIncidents    # Debería mostrar los incidents en dev
```

