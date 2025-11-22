import { internalMutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const seed = internalMutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    // 1. Create Dispatcher (Daniel)
    const danielId = await ctx.db.insert("dispatchers", {
      name: "Daniel V.",
      email: "daniel@tiqn.app",
      badgeNumber: "D-001",
      isActive: true,
      createdAt: Date.now(),
    });

    // 2. Create Rescuers
    const rescuer1Id = await ctx.db.insert("rescuers", {
      name: "Jorge Silva",
      email: "jorge@tiqn.app",
      phone: "+56911112222",
      badgeNumber: "R-2847",
      status: "available",
      currentLocation: {
        lat: -33.408, // Near Las Condes
        lng: -70.565,
        lastUpdated: Date.now(),
      },
      stats: {
        totalRescues: 45,
        avgResponseTime: 2.3,
      },
      isActive: true,
      createdAt: Date.now(),
    });

    await ctx.db.insert("rescuers", {
      name: "Ana Torres",
      email: "ana@tiqn.app",
      phone: "+56933334444",
      badgeNumber: "R-2899",
      status: "on_call", // Busy
      currentLocation: {
        lat: -33.412,
        lng: -70.570,
        lastUpdated: Date.now(),
      },
      stats: {
        totalRescues: 112,
        avgResponseTime: 1.8,
      },
      isActive: true,
      createdAt: Date.now(),
    });

    // 3. Create Patients (from sample logic or explicit insert)
    const patientRobertoId = await ctx.db.insert("patients", {
      firstName: "Roberto",
      lastName: "Soto",
      age: 65,
      sex: "M",
      rut: "12.345.678-9",
      medicalHistory: ["Hypertension", "High Cholesterol"],
      medications: ["Lisinopril 10mg", "Atorvastatin 20mg"],
      allergies: ["Penicillin"],
      phone: "+56912345678",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create Judge/Demo Patient
    await ctx.db.insert("patients", {
      firstName: "Juez",
      lastName: "Demo",
      age: 35,
      sex: "M",
      rut: "18.999.888-7",
      medicalHistory: [],
      medications: [],
      allergies: ["Peanuts"],
      phone: "+56999999999",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 4. Create an Active Incident (Cardiac Arrest)
    const incidentId = await ctx.db.insert("incidents", {
      incidentNumber: "INC-2024-0892",
      status: "confirmed",
      priority: "critical",
      incidentType: "Cardiac Arrest Protocol",
      description: "Patient experiencing chest pain and difficulty breathing.",
      location: {
        address: "Av. Apoquindo 4500, Las Condes",
        coordinates: {
          lat: -33.410,
          lng: -70.568,
        },
      },
      times: {
        callReceived: Date.now() - 1000 * 60 * 2, // 2 mins ago
        confirmed: Date.now() - 1000 * 60 * 1,
      },
      estimates: {
        distanceKm: 2.3,
        etaMinutes: 3,
      },
      dispatcherId: danielId,
      patientId: patientRobertoId,
    });

    // 5. Create the Call Record
    await ctx.db.insert("calls", {
      twilioCallSid: "CA" + Math.random().toString(36).substring(7),
      incidentId: incidentId,
      callerPhone: "+56912345678",
      status: "in_progress",
      startedAt: Date.now() - 1000 * 60 * 2,
      transcriptionChunks: [
        { offset: 0, speaker: "system", text: "Call started." },
        { offset: 2, speaker: "dispatcher", text: "TIQN Emergency Dispatch. State your emergency." },
        { offset: 5, speaker: "caller", text: "Please help! I think my father is having a heart attack..." },
      ],
    });

    return "Seed completed successfully!";
  },
});

