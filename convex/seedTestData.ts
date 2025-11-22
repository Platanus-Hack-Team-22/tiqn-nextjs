import { internalMutation } from "./_generated/server";

export const createTestData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const incidentTypes = [
      "Cardiac Arrest",
      "Respiratory Emergency",
      "Traffic Accident",
      "Fall Injury",
      "Stroke",
      "Allergic Reaction",
      "Diabetic Emergency",
      "Seizure",
      "Burn Injury",
      "Chest Pain",
    ];

    const descriptions = [
      "Patient experiencing severe chest pain and difficulty breathing.",
      "Elderly patient fell and is unable to move. Possible fracture.",
      "Multi-vehicle collision with injuries reported.",
      "Patient having difficulty breathing and wheezing.",
      "Patient unconscious and unresponsive.",
      "Patient experiencing severe allergic reaction with swelling.",
      "Diabetic patient with altered mental status.",
      "Patient having seizure, post-ictal state.",
      "Burn injury from kitchen accident.",
      "Patient with sudden onset of chest pain.",
    ];

    const santiagoCommunas = [
      { name: "Las Condes", lat: -33.41, lng: -70.58 },
      { name: "Providencia", lat: -33.43, lng: -70.61 },
      { name: "Vitacura", lat: -33.38, lng: -70.57 },
      { name: "Santiago Centro", lat: -33.45, lng: -70.66 },
      { name: "Ñuñoa", lat: -33.46, lng: -70.60 },
      { name: "La Reina", lat: -33.45, lng: -70.54 },
      { name: "Peñalolén", lat: -33.48, lng: -70.52 },
      { name: "Macul", lat: -33.49, lng: -70.60 },
      { name: "San Miguel", lat: -33.50, lng: -70.65 },
      { name: "La Florida", lat: -33.52, lng: -70.60 },
    ];

    const streetNames = [
      "Av. Apoquindo", "Av. Providencia", "Av. Vitacura", "Av. Las Condes",
      "Calle Los Militares", "Av. Grecia", "Av. Irarrázaval", "Calle Bilbao",
      "Av. Vicuña Mackenna", "Av. Tobalaba", "Calle Suecia", "Av. Pedro de Valdivia",
    ];

    const firstNames = [
      "María", "José", "Carlos", "Ana", "Luis", "Carmen", "Pedro", "Isabel",
      "Jorge", "Rosa", "Manuel", "Teresa", "Francisco", "Patricia", "Roberto",
    ];

    const lastNames = [
      "González", "Rodríguez", "Fernández", "López", "Martínez", "García",
      "Pérez", "Muñoz", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera",
    ];

    const conditions = [
      "Hypertension", "Diabetes Type 2", "Asthma", "High Cholesterol",
      "Arthritis", "COPD", "Epilepsy", "Heart Disease",
    ];

    const medications = [
      "Metformin", "Lisinopril", "Atorvastatin", "Aspirin", "Losartan",
      "Amlodipine", "Omeprazole", "Levothyroxine", "Albuterol",
    ];

    const allergies = [
      "Penicillin", "Aspirin", "Ibuprofen", "Shellfish", "Peanuts",
      "Latex", "Sulfa drugs",
    ];

    const randomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

    const randomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const randomLocation = () => {
      const comuna = randomElement(santiagoCommunas);
      const latOffset = (Math.random() - 0.5) * 0.02;
      const lngOffset = (Math.random() - 0.5) * 0.02;
      return {
        lat: comuna.lat + latOffset,
        lng: comuna.lng + lngOffset,
        comuna: comuna.name,
      };
    };

    const dispatcher = await ctx.db.insert("dispatchers", {
      name: "Central Dispatch",
      phone: "+56912345000",
    });

    const rescuerNames = [
      { name: "Jorge Silva", phone: "+56911112222" },
      { name: "Ana Torres", phone: "+56933334444" },
      { name: "Carlos Morales", phone: "+56955556666" },
      { name: "María González", phone: "+56977778888" },
      { name: "Luis Ramírez", phone: "+56999990000" },
      { name: "Carmen Flores", phone: "+56922221111" },
    ];

    console.log("Creating rescuers...");
    for (const rescuerData of rescuerNames) {
      const loc = randomLocation();
      await ctx.db.insert("rescuers", {
        name: rescuerData.name,
        phone: rescuerData.phone,
        currentLocation: {
          lat: loc.lat,
          lng: loc.lng,
          lastUpdated: Date.now(),
        },
        stats: {
          totalRescues: randomInt(10, 150),
          avgResponseTime: Math.random() * 5 + 1,
        },
      });
    }

    console.log("Creating patients and incidents...");
    for (let i = 0; i < 15; i++) {
      const loc = randomLocation();
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);

      const patientAllergies: string[] = [];
      if (Math.random() > 0.6) {
        patientAllergies.push(randomElement(allergies));
      }
      if (Math.random() > 0.8) {
        patientAllergies.push(randomElement(allergies.filter(a => !patientAllergies.includes(a))));
      }

      const medicalHistory: string[] = [];
      const numConditions = randomInt(0, 3);
      for (let j = 0; j < numConditions; j++) {
        const condition = randomElement(conditions);
        if (!medicalHistory.includes(condition)) {
          medicalHistory.push(condition);
        }
      }

      const patientMedications: string[] = [];
      const numMeds = randomInt(0, 4);
      for (let j = 0; j < numMeds; j++) {
        const med = randomElement(medications);
        if (!patientMedications.includes(med)) {
          patientMedications.push(med);
        }
      }

      const patientId = await ctx.db.insert("patients", {
        firstName,
        lastName,
        age: randomInt(18, 85),
        sex: Math.random() > 0.5 ? "M" : "F",
        rut: `${randomInt(10, 25)}.${randomInt(100, 999)}.${randomInt(100, 999)}-${randomInt(0, 9)}`,
        medicalHistory,
        medications: patientMedications,
        allergies: patientAllergies,
        phone: `+569${randomInt(10000000, 99999999)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const street = randomElement(streetNames);
      const number = randomInt(1000, 9999);

      const priorities = ["low", "medium", "high", "critical"];
      const priority = randomElement(priorities) as "low" | "medium" | "high" | "critical";

      const incidentId = await ctx.db.insert("incidents", {
        status: "confirmed" as const,
        priority,
        incidentType: randomElement(incidentTypes),
        description: randomElement(descriptions),
        address: `${street} ${number}, ${loc.comuna}, Santiago`,
        district: loc.comuna,
        coordinates: {
          lat: loc.lat,
          lng: loc.lng,
        },
        dispatcherId: dispatcher,
        patientId,
      });

      await ctx.db.insert("calls", {
        incidentId,
        transcriptionChunks: [
          { offset: 0, speaker: "system", text: "Emergency call started." },
          { offset: 2, speaker: "dispatcher", text: "TIQN Emergency. What's your emergency?" },
          { offset: 5, speaker: "caller", text: `We need help at ${street} ${number}!` },
        ],
      });

      await ctx.db.insert("incidentAssignments", {
        incidentId,
        status: "pending",
        times: {
          offered: Date.now() - randomInt(60000, 300000),
        },
      });
    }

    return {
      success: true,
      message: `Created 6 rescuers, 15 patients, 15 incidents, and 15 pending assignments`
    };
  },
});
