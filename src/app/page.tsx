"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  // Queries to verify seed data
  const dispatchers = useQuery(api.verification.getDispatchers);
  const incidents = useQuery(api.verification.getIncidents);
  const patients = useQuery(api.verification.getPatients);

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-slate-50 text-slate-900">
      <h1 className="text-4xl font-bold mb-8 text-blue-600">TIQN System Check</h1>
      
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Dispatchers Check */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Dispatchers</h2>
          {dispatchers ? (
            <ul className="space-y-2">
              {dispatchers.map((d) => (
                <li key={d._id} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{d.phone ?? "N/A"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-sm">Loading...</p>
          )}
        </div>

        {/* Incidents Check */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Active Incidents</h2>
          {incidents ? (
            <ul className="space-y-3">
              {incidents.map((inc) => (
                <li key={inc._id} className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs text-slate-500">{inc._id.slice(-8)}</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded uppercase font-bold">{inc.priority}</span>
                  </div>
                  <div className="font-medium text-slate-800">{inc.incidentType}</div>
                  <div className="text-xs text-slate-500 truncate">{inc.address ?? "N/A"}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-sm">Loading...</p>
          )}
        </div>

        {/* Patients Check */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Patients</h2>
          {patients ? (
            <ul className="space-y-2">
              {patients.map((p) => (
                <li key={p._id} className="text-sm border-b border-slate-100 last:border-0 pb-2">
                  <div className="font-medium">{p.firstName} {p.lastName}</div>
                  <div className="text-xs text-slate-500">{p.rut ?? "No RUT"} • {p.age} yo</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-sm">Loading...</p>
          )}
        </div>

      </div>
      
      <div className="mt-12 text-sm text-slate-400">
        Status: <span className="text-green-600 font-medium">System Operational</span> • Convex Connected
      </div>
    </main>
  );
}
