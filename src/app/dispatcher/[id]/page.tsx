"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { DispatcherHeader } from "~/components/ui/DispatcherHeader";
import { TranscriptionFeed } from "~/components/dispatcher/TranscriptionFeed";
import { IncidentForm } from "~/components/dispatcher/IncidentForm";
import { DispatchAlert } from "~/components/dispatcher/DispatchAlert";
import { useState, useEffect } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function LiveIncidentPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as Id<"incidents">;
  const [callDuration, setCallDuration] = useState(0);
  const [showDispatchAlert, setShowDispatchAlert] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  const incident = useQuery(api.incidents.getIncident, { incidentId });
  const acceptCall = useMutation(api.incidents.acceptCall);

  // Auto-accept call if it's incoming_call
  useEffect(() => {
    if (!incident || hasAccepted) return;
    
    if (incident.status === "incoming_call" && incident.dispatcherId) {
      // Aceptar automáticamente la llamada cuando se abre la vista
      acceptCall({
        incidentId: incident._id,
        dispatcherId: incident.dispatcherId,
      })
        .then(() => {
          setHasAccepted(true);
        })
        .catch((error) => {
          console.error("Error accepting call:", error);
        });
    }
  }, [incident, acceptCall, hasAccepted]);

  // Calculate call duration based on lastUpdated time
  useEffect(() => {
    if (!incident) return;
    const startTime = incident.lastUpdated ?? Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setCallDuration(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [incident]);

  // Show dispatch alert when incident is confirmed
  useEffect(() => {
    if (incident?.status === "confirmed" && incident.patient && incident.address) {
      setShowDispatchAlert(true);
    }
  }, [incident]);

  if (!incident) {
    return (
      <div className="h-screen flex flex-col">
        <DispatcherHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-400">Loading incident...</div>
        </main>
      </div>
    );
  }

  const transcriptionChunks = incident.call?.transcriptionChunks ?? [];
  const fullTranscription = incident.call?.transcription;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Live Header */}
      <div className="h-12 bg-gradient-to-r from-red-50 to-red-100/50 border-b border-red-200 flex items-center justify-between px-6 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dispatcher")}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 text-xs transition uppercase tracking-wider"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </button>
          <div className="h-5 w-px bg-slate-300"></div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse-critical"></div>
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              Active Incident
            </span>
            <span className="text-xs font-mono text-slate-600 ml-1">{formatTimer(callDuration)}</span>
            <span className="text-[10px] text-slate-500 font-mono">{incident._id.slice(-8)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded text-xs font-medium border border-slate-300 transition uppercase tracking-wider">
            Request MD
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-semibold border border-red-700 transition uppercase tracking-wider">
            End Call
          </button>
        </div>
      </div>

      {/* Live Content Grid */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* LEFT PANEL: Transcription & Intelligence */}
        <div className="col-span-5 border-r border-slate-200 flex flex-col bg-white">
          <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 text-slate-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
              Live Transcription
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse-critical"></div>
              <span className="text-[10px] text-blue-600 font-mono">AI Processing</span>
            </div>
          </div>

          <TranscriptionFeed chunks={transcriptionChunks} fullText={fullTranscription} />

          {/* Waveform visualization placeholder */}
          <div className="h-10 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-3">
            <div className="flex items-center gap-1">
              <div className="w-0.5 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-0.5 h-3 bg-blue-500 rounded-full animate-pulse delay-75"></div>
              <div className="w-0.5 h-4 bg-blue-500 rounded-full animate-pulse delay-100"></div>
              <div className="w-0.5 h-2.5 bg-blue-500 rounded-full animate-pulse delay-150"></div>
              <div className="w-0.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-200"></div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">HD Audio • 16kHz</span>
          </div>
        </div>

        {/* RIGHT PANEL: Structured Data (Golden Record) */}
        <div className="col-span-7 bg-slate-50 flex flex-col overflow-y-auto">
          <IncidentForm
            incidentType={incident.incidentType}
            location={{
              address: incident.address ?? "",
              district: incident.district,
              reference: incident.reference,
            }}
            patient={incident.patient ?? undefined}
          />
        </div>
      </div>

      {/* Dispatch Alert Popup */}
      {showDispatchAlert && (
        <DispatchAlert
          incidentType={incident.incidentType ?? ""}
          location={incident.address ?? ""}
          onClose={() => setShowDispatchAlert(false)}
          onDispatch={() => {
            // TODO: Implement dispatch mutation
            console.log("Dispatch sent!");
            setShowDispatchAlert(false);
          }}
        />
      )}
    </div>
  );
}

