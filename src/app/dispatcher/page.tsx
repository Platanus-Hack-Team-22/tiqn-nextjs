"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { DispatcherHeader } from "~/components/ui/DispatcherHeader";
import { IncidentCard } from "~/components/ui/IncidentCard";
import { useMemo, useState, useEffect } from "react";

type IncidentWithRelations = {
  _id: Id<"incidents">;
  incidentType?: string | null;
  address?: string | null;
  patient?: { phone?: string | null } | null;
  priority: "low" | "medium" | "high" | "critical";
  status: "incoming_call" | "confirmed" | "rescuer_assigned" | "in_progress" | "completed" | "cancelled";
  elapsedTime?: string;
};

export default function DispatcherDashboard() {
  const incomingCalls = useQuery(api.incidents.getIncomingCalls) as IncidentWithRelations[] | undefined;
  const activeIncidents = useQuery(api.incidents.getActiveIncidents) as IncidentWithRelations[] | undefined;
  const recentIncidents = useQuery(api.incidents.getRecentIncidents, { limit: 10 }) as IncidentWithRelations[] | undefined;
  const [currentTime, setCurrentTime] = useState<string>("");

  // Update time only on client to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("es-CL", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate elapsed time for active incidents
  // Note: Since schema doesn't have createdAt, we'll show a placeholder
  const incidentsWithTime = useMemo(() => {
    if (!activeIncidents) return [] as IncidentWithRelations[];
    return activeIncidents.map((incident): IncidentWithRelations => {
      // For now, use a placeholder since schema doesn't have createdAt
      // TODO: Add createdAt field to incidents schema
      return {
        ...incident,
        elapsedTime: "00:00", // Placeholder
      };
    });
  }, [activeIncidents]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <DispatcherHeader />
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 p-6 overflow-y-auto scrollbar-hide">
          {/* Section: Incoming Calls */}
          {incomingCalls && incomingCalls.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider">
                    Llamadas Entrantes
                  </h2>
                  <span className="text-xs text-red-500 font-mono bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {incomingCalls.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incomingCalls.map((incident) => (
                  <IncidentCard
                    key={incident._id}
                    incidentId={incident._id}
                    incidentNumber={incident._id.slice(-8)} // Usar últimos 8 caracteres del ID como número
                    incidentType={incident.incidentType ?? "Llamada entrante"}
                    location={incident.address ?? "Ubicación pendiente"}
                    phone={incident.patient?.phone ?? undefined}
                    priority={incident.priority}
                    status={incident.status}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section: Active Incidents */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Active Incidents
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  {incidentsWithTime.length}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {currentTime ?? "--:--:--"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {incidentsWithTime.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-slate-400 text-sm">
                  No active incidents
                </div>
              ) : (
                incidentsWithTime.map((incident) => (
                  <IncidentCard
                    key={incident._id}
                    incidentId={incident._id}
                    incidentNumber={incident._id.slice(-8)} // Usar últimos 8 caracteres del ID
                    incidentType={incident.incidentType ?? undefined}
                    location={incident.address ?? "Ubicación pendiente"}
                    phone={incident.patient?.phone ?? undefined}
                    priority={incident.priority}
                    status={incident.status}
                    elapsedTime={incident.elapsedTime}
                  />
                ))
              )}
            </div>
          </div>

          {/* Section: Historical */}
          <div>
            <div className="flex items-center justify-between mb-3 border-t border-slate-200 pt-6">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Recent Activity
              </h2>
              <div className="flex gap-2">
                <button className="text-[10px] bg-white hover:bg-slate-50 px-2.5 py-1 rounded border border-slate-300 text-slate-600 uppercase tracking-wider transition">
                  Filter
                </button>
                <button className="text-[10px] bg-white hover:bg-slate-50 px-2.5 py-1 rounded border border-slate-300 text-slate-600 uppercase tracking-wider transition">
                  Export
                </button>
              </div>
            </div>
            <div className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-mono">
                      ID
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-mono">
                      Time
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Location
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Outcome
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {recentIncidents && recentIncidents.length > 0 ? (
                    recentIncidents.map((incident) => (
                      <tr
                        key={incident._id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-slate-900">
                          {incident._id.slice(-8)}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">
                          {new Date().toLocaleTimeString("es-CL", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {incident.incidentType ?? "Unknown"}
                        </td>
                        <td className="px-4 py-3 font-mono truncate max-w-xs">
                          {incident.address ?? "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] border border-slate-300">
                            {incident.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-emerald-600 font-mono text-[10px]">
                          {incident.status === "completed" ? "Success" : incident.status}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                        No recent activity
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

