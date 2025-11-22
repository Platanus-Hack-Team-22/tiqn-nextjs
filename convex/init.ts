import { internalMutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const seed = internalMutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    // 1. Create Dispatcher (Daniel)
    const danielId = await ctx.db.insert("dispatchers", {
      name: "Daniel V.",
      phone: "+56912345678",
    });

    // 2. Create Rescuers
    const rescuer1Id = await ctx.db.insert("rescuers", {
      name: "Jorge Silva",
      phone: "+56911112222",
      currentLocation: {
        lat: -33.4489,
        lng: -70.6693,
        lastUpdated: Date.now(),
      },
      stats: {
        totalRescues: 45,
        avgResponseTime: 2.3,
      },
    });

    await ctx.db.insert("rescuers", {
      name: "Ana Torres",
      phone: "+56933334444",
      currentLocation: {
        lat: -33.4372,
        lng: -70.6506,
        lastUpdated: Date.now(),
      },
      stats: {
        totalRescues: 112,
        avgResponseTime: 1.8,
      },
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
      status: "confirmed",
      priority: "critical",
      incidentType: "Cardiac Arrest Protocol",
      description: "Patient experiencing chest pain and difficulty breathing.",
      address: "Av. Apoquindo 4500",
      district: "Las Condes",
      coordinates: {
        lat: -33.410,
        lng: -70.568,
      },
      dispatcherId: danielId,
      patientId: patientRobertoId,
    });

    // 5. Create the Call Record
    await ctx.db.insert("calls", {
      incidentId: incidentId,
      transcriptionChunks: [
        { offset: 0, speaker: "system", text: "Call started." },
        { offset: 2, speaker: "dispatcher", text: "TIQN Emergency Dispatch. State your emergency." },
        { offset: 5, speaker: "caller", text: "Please help! I think my father is having a heart attack..." },
      ],
    });

    // 6. Create a pending incident assignment for rescuers to see
    await ctx.db.insert("incidentAssignments", {
      incidentId: incidentId,
      status: "pending",
      times: {
        offered: Date.now(),
      },
    });

    return "Seed completed successfully with simplified schema!";
  },
});
