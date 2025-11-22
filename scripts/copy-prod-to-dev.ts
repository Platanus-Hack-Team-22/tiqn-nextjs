#!/usr/bin/env tsx
/**
 * Script para copiar datos de producción a desarrollo
 * 
 * IMPORTANTE: Este script SOLO LEE de producción y ESCRIBE en desarrollo
 * NO modifica producción en absoluto
 * 
 * Uso:
 *   1. Conectarse temporalmente a prod para leer datos
 *   2. Cambiar a dev
 *   3. Ejecutar este script para poblar dev
 */

import { ConvexHttpClient } from "convex/browser";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const PROD_DEPLOYMENT = "prod:festive-kiwi-66|eyJ2MiI6IjE3ZGMxYTMxNmUwYjRhOWNiYTFmNDRkYjU1MDI1OTk0In0=";
const PROD_URL = "https://festive-kiwi-66.convex.cloud";

async function main() {
  console.log("🔄 Copiando datos de producción a desarrollo...\n");

  // Paso 1: Leer datos de producción
  console.log("📖 Paso 1: Leyendo datos de producción (SOLO LECTURA)...");
  const prodClient = new ConvexHttpClient(PROD_URL);
  prodClient.setAuth(PROD_DEPLOYMENT);

  try {
    const dispatchers = await prodClient.query("copyFromProd:getProdDispatchers", {});
    const rescuers = await prodClient.query("copyFromProd:getProdRescuers", {});
    const patients = await prodClient.query("copyFromProd:getProdPatients", {});
    const incidents = await prodClient.query("copyFromProd:getProdIncidents", {});
    const calls = await prodClient.query("copyFromProd:getProdCalls", {});
    const assignments = await prodClient.query("copyFromProd:getProdIncidentAssignments", {});
    const appState = await prodClient.query("copyFromProd:getProdAppState", {});

    console.log(`✅ Datos leídos de producción:`);
    console.log(`   - Dispatchers: ${dispatchers.length}`);
    console.log(`   - Rescuers: ${rescuers.length}`);
    console.log(`   - Patients: ${patients.length}`);
    console.log(`   - Incidents: ${incidents.length}`);
    console.log(`   - Calls: ${calls.length}`);
    console.log(`   - Assignments: ${assignments.length}`);
    console.log(`   - App State: ${appState ? "Sí" : "No"}\n`);

    // Paso 2: Conectarse a dev y poblar datos
    console.log("📝 Paso 2: Poblando desarrollo...");
    
    const devUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!devUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL no está configurado. Ejecuta 'pnpx convex dev' primero.");
    }

    const devDeployment = process.env.CONVEX_DEPLOYMENT;
    if (!devDeployment) {
      throw new Error("CONVEX_DEPLOYMENT no está configurado. Ejecuta 'pnpx convex dev' primero.");
    }

    console.log(`   Conectado a dev: ${devUrl}`);
    console.log(`   Deployment: ${devDeployment}\n`);

    const devClient = new ConvexHttpClient(devUrl);
    devClient.setAuth(devDeployment);

    // Limpiar datos existentes en dev (opcional, comentado por seguridad)
    // console.log("⚠️  Limpiando datos existentes en dev...");
    // await devClient.mutation("seedFromProd:clearAll", {});

    // Insertar dispatchers primero (necesarios para incidents)
    console.log("   Insertando dispatchers...");
    const dispatcherResult = await devClient.mutation("seedFromProd:seedDispatchers", {
      dispatchers: dispatchers.map((d: any) => ({
        name: d.name,
        phone: d.phone,
      })),
    });
    console.log(`   ✅ ${dispatcherResult.inserted} dispatchers insertados`);

    // Crear mapa de IDs de dispatchers
    const dispatcherIdMap: Record<string, string> = {};
    dispatchers.forEach((oldD: any, index: number) => {
      dispatcherIdMap[oldD._id] = dispatcherResult.ids[index];
    });

    // Insertar rescuers
    console.log("   Insertando rescuers...");
    const rescuerResult = await devClient.mutation("seedFromProd:seedRescuers", {
      rescuers: rescuers.map((r: any) => ({
        name: r.name,
        phone: r.phone,
        currentLocation: r.currentLocation,
        stats: r.stats,
      })),
    });
    console.log(`   ✅ ${rescuerResult.inserted} rescuers insertados`);

    // Crear mapa de IDs de rescuers
    const rescuerIdMap: Record<string, string> = {};
    rescuers.forEach((oldR: any, index: number) => {
      rescuerIdMap[oldR._id] = rescuerResult.ids[index];
    });

    // Insertar patients
    console.log("   Insertando patients...");
    const patientResult = await devClient.mutation("seedFromProd:seedPatients", {
      patients: patients.map((p: any) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        age: p.age,
        sex: p.sex,
        phone: p.phone,
        address: p.address,
        city: p.city,
        district: p.district,
        coordinates: p.coordinates,
        medicalHistory: p.medicalHistory || [],
        medications: p.medications || [],
        allergies: p.allergies || [],
        bloodType: p.bloodType,
        emergencyContact: p.emergencyContact,
        photoUrl: p.photoUrl,
        notes: p.notes,
        rut: p.rut,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
    console.log(`   ✅ ${patientResult.inserted} patients insertados`);

    // Crear mapa de IDs de patients
    const patientIdMap: Record<string, string> = {};
    patients.forEach((oldP: any, index: number) => {
      patientIdMap[oldP._id] = patientResult.ids[index];
    });

    // Insertar incidents (usando mapas de IDs)
    console.log("   Insertando incidents...");
    const incidentResult = await devClient.mutation("seedFromProd:seedIncidents", {
      incidents: incidents.map((i: any) => ({
        status: i.status,
        priority: i.priority,
        dispatcherId: i.dispatcherId,
        address: i.address,
        district: i.district,
        reference: i.reference,
        apartment: i.apartment,
        coordinates: i.coordinates,
        callSessionId: i.callSessionId,
        lastUpdated: i.lastUpdated,
        firstName: i.firstName,
        lastName: i.lastName,
        patientAge: i.patientAge,
        patientSex: i.patientSex,
        patientId: i.patientId,
        consciousness: i.consciousness,
        breathing: i.breathing,
        avdi: i.avdi,
        respiratoryStatus: i.respiratoryStatus,
        symptomOnset: i.symptomOnset,
        medicalHistory: i.medicalHistory,
        currentMedications: i.currentMedications,
        allergies: i.allergies,
        vitalSigns: i.vitalSigns,
        requiredRescuers: i.requiredRescuers,
        requiredResources: i.requiredResources,
        healthInsurance: i.healthInsurance,
        conciergeNotified: i.conciergeNotified,
        incidentType: i.incidentType,
        description: i.description,
        fullTranscript: i.fullTranscript,
        rawCanonicalData: i.rawCanonicalData,
      })),
      dispatcherIdMap,
      patientIdMap,
    });
    console.log(`   ✅ ${incidentResult.inserted} incidents insertados`);

    // Crear mapa de IDs de incidents
    const incidentIdMap: Record<string, string> = {};
    incidents.forEach((oldI: any, index: number) => {
      incidentIdMap[oldI._id] = incidentResult.ids[index];
    });

    // Insertar calls (usando mapa de IDs de incidents)
    console.log("   Insertando calls...");
    const callResult = await devClient.mutation("seedFromProd:seedCalls", {
      calls: calls.map((c: any) => ({
        incidentId: c.incidentId,
        transcription: c.transcription,
        transcriptionChunks: c.transcriptionChunks,
      })),
      incidentIdMap,
    });
    console.log(`   ✅ ${callResult.inserted} calls insertados`);

    // Insertar assignments (usando mapas de IDs)
    console.log("   Insertando incident assignments...");
    const assignmentResult = await devClient.mutation("seedFromProd:seedIncidentAssignments", {
      assignments: assignments.map((a: any) => ({
        incidentId: a.incidentId,
        rescuerId: a.rescuerId,
        status: a.status,
        times: a.times,
      })),
      incidentIdMap,
      rescuerIdMap,
    });
    console.log(`   ✅ ${assignmentResult.inserted} assignments insertados`);

    // Insertar app state
    if (appState) {
      console.log("   Insertando app state...");
      await devClient.mutation("seedFromProd:seedAppState", {
        appState: {
          activeDispatcherId: appState.activeDispatcherId,
        },
        dispatcherIdMap,
      });
      console.log(`   ✅ App state insertado`);
    }

    console.log("\n✅ ¡Copia completada exitosamente!");
    console.log(`   Todos los datos de producción han sido copiados a desarrollo.`);

  } catch (error) {
    console.error("\n❌ Error durante la copia:", error);
    process.exit(1);
  }
}

main().catch(console.error);

