"use client";

import { useEffect, useState, useCallback } from "react";
import { Device, type Call } from "@twilio/voice-sdk";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type CallStatus =
  | "initializing"
  | "ready"
  | "incoming"
  | "connected"
  | "offline"
  | "error";

interface TokenResponse {
  identity: string;
  token: string;
}

export default function Home() {
  const dispatchers = useQuery(api.dispatchers.list);
  const createDispatcher = useMutation(api.dispatchers.create);
  const setActiveDispatcher = useMutation(api.app_state.setActiveDispatcher);
  const appState = useQuery(api.app_state.get);
  const incident = useQuery(
    api.incidents.get,
    appState?.activeIncidentId ? { id: appState.activeIncidentId } : "skip"
  );
  const recentIncidents = useQuery(api.incidents.listRecent, { limit: 20 });
  const createPendingAssignment = useMutation(api.incidentAssignments.createPendingAssignment);

  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("initializing");
  const [identity, setIdentity] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedDispatcherId, setSelectedDispatcherId] = useState<string>("");
  const [incidentApproved, setIncidentApproved] = useState(false);
  const [persistedIncident, setPersistedIncident] = useState<typeof incident>(null);

  // Persist incident data when it updates
  useEffect(() => {
    if (incident) {
      setPersistedIncident(incident);
    }
  }, [incident]);

  // Use active incident if available, otherwise show persisted data
  const displayIncident = incident ?? persistedIncident;

  const addLog = useCallback((msg: string) => {
    const time =
      new Date().toISOString().split("T")[1]?.split(".")[0] ?? "00:00:00";
    setLogs((prev) => [...prev, `${time} - ${msg}`]);
    console.log(msg);
  }, []);

  const handleDispatcherChange = useCallback(async (id: string) => {
    setSelectedDispatcherId(id);
    try {
      await setActiveDispatcher({ dispatcherId: id as Id<"dispatchers"> });
      addLog(`Active dispatcher set to: ${id}`);
    } catch (e) {
      addLog(`Error setting active dispatcher: ${e as string}`);
    }
  }, [setActiveDispatcher, addLog]);

  // Create mock dispatcher if none exist
  useEffect(() => {
    if (dispatchers === undefined) return; // Loading

    if (dispatchers.length === 0) {
      addLog("No dispatchers found. Creating mock dispatcher...");
      createDispatcher({ name: "Mock Dispatcher", phone: "+56912345678" })
        .then((id) => {
          addLog(`Created mock dispatcher: ${id}`);
          void handleDispatcherChange(id);
        })
        .catch((e) => addLog(`Error creating mock dispatcher: ${e as string}`));
    } else if (!selectedDispatcherId && dispatchers.length > 0) {
      // Auto-select the first dispatcher if none selected
      const first = dispatchers[0];
      if (first) {
        addLog(`Auto-selecting dispatcher: ${first.name}`);
        void handleDispatcherChange(first._id);
      }
    }
  }, [
    dispatchers,
    createDispatcher,
    selectedDispatcherId,
    handleDispatcherChange,
    addLog,
  ]);

  // Handle selection change

  // Initialize Device when selectedDispatcherId changes
  useEffect(() => {
    if (!selectedDispatcherId) return;

    let mounted = true;
    let activeDevice: Device | null = null;

    const initDevice = async () => {
      try {
        addLog(`Fetching access token for ${selectedDispatcherId}...`);
        // Pass the selected dispatcher ID as identity
        const response = await fetch(
          `/api/twilio/token?identity=${selectedDispatcherId}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch token: ${response.statusText}`);
        }
        const data = (await response.json()) as TokenResponse;

        if (!mounted) return;

        setIdentity(data.identity);
        addLog(`Got token for identity: ${data.identity}`);

        const newDevice = new Device(data.token, {
          logLevel: 1,
        });

        newDevice.on("registered", () => {
          if (!mounted) return;
          addLog("Device registered and ready");
          setCallStatus("ready");
        });

        newDevice.on("error", (error: { message: string }) => {
          if (!mounted) return;
          addLog(`Device error: ${error.message}`);
          setCallStatus("error");
        });

        newDevice.on("incoming", (call: Call) => {
          if (!mounted) return;
          addLog(`Incoming call from ${call.parameters.From}`);
          setCallStatus("incoming");
          setCurrentCall(call);

          call.on("disconnect", () => {
            if (!mounted) return;
            addLog("Call disconnected");
            setCallStatus("ready");
            setCurrentCall(null);
            setIncidentApproved(false);
          });

          call.on("cancel", () => {
            if (!mounted) return;
            addLog("Call canceled");
            setCallStatus("ready");
            setCurrentCall(null);
            setIncidentApproved(false);
          });
        });

        await newDevice.register();

        if (mounted) {
          activeDevice = newDevice;
        } else {
          newDevice.destroy();
        }
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        addLog(`Error initializing device: ${message}`);
        setCallStatus("error");
      }
    };

    void initDevice();

    // Cleanup
    return () => {
      mounted = false;
      if (activeDevice) {
        addLog("Cleaning up device...");
        activeDevice.destroy();
      }
    };
  }, [selectedDispatcherId, addLog]);

  const handleAccept = () => {
    if (currentCall) {
      addLog("Accepting call...");
      currentCall.accept();
      setCallStatus("connected");
    }
  };

  const handleDecline = () => {
    if (currentCall) {
      addLog("Declining call...");
      currentCall.reject();
      setCallStatus("ready");
      setCurrentCall(null);
      setIncidentApproved(false);
    }
  };

  const handleDisconnect = () => {
    if (currentCall) {
      addLog("Disconnecting call...");
      currentCall.disconnect();
      setCallStatus("ready");
      setCurrentCall(null);
      setIncidentApproved(false);
    }
  };

  const handleApproveIncident = async () => {
    if (!displayIncident?._id) {
      addLog("No incident to approve");
      return;
    }

    try {
      addLog("Approving incident as true emergency...");
      await createPendingAssignment({ incidentId: displayIncident._id });
      setIncidentApproved(true);
      addLog("Incident approved! Assignment created with pending status.");
    } catch (e) {
      addLog(`Error approving incident: ${e as string}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-gray-100">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 border-b border-cyan-900/50 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-wide text-cyan-400">EMERGENCY DISPATCH SYSTEM</h1>
              <p className="mt-1 font-mono text-sm text-gray-400">
                {identity ? `OPERATOR: ${identity}` : "INITIALIZING..."}
              </p>
            </div>
            <div className={`flex items-center gap-3 rounded border px-4 py-2 font-mono text-sm ${
              callStatus === "incoming"
                ? "animate-pulse border-amber-500/50 bg-amber-500/10 text-amber-400"
                : callStatus === "connected"
                  ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  : callStatus === "ready"
                    ? "border-gray-600/50 bg-gray-800/50 text-gray-400"
                    : "border-red-500/50 bg-red-500/10 text-red-400"
            }`}>
              <div className={`h-2 w-2 rounded-full ${
                callStatus === "incoming" ? "bg-amber-400 animate-pulse" :
                callStatus === "connected" ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" :
                callStatus === "ready" ? "bg-gray-400" : "bg-red-400"
              }`} />
              STATUS: {callStatus.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Dispatcher Selection - Only show when not connected */}
        {callStatus !== "connected" && (
          <div className="mb-6 w-full max-w-md">
            <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-gray-400">
              Dispatcher
            </label>
            <select
              className="w-full rounded border border-gray-700 bg-slate-900 p-3 font-mono text-sm text-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              value={selectedDispatcherId}
              onChange={(e) => handleDispatcherChange(e.target.value)}
            >
              <option value="" disabled>
                Select a dispatcher...
              </option>
              {dispatchers?.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} {d.phone ? `(${d.phone})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* === ACTIVE INCIDENT SECTION === */}
        {(callStatus === "incoming" || callStatus === "connected" || displayIncident) && (
          <div className="mb-8">
            {/* Call Controls */}
            {callStatus === "incoming" && (
              <div className="mb-6 flex gap-4">
                <button
                  onClick={handleAccept}
                  className="flex-1 rounded border border-cyan-500/50 bg-cyan-500/10 px-8 py-4 font-mono text-sm uppercase tracking-wide text-cyan-400 transition hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  Accept Call
                </button>
                <button
                  onClick={handleDecline}
                  className="flex-1 rounded border border-red-500/50 bg-red-500/10 px-8 py-4 font-mono text-sm uppercase tracking-wide text-red-400 transition hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                >
                  Decline
                </button>
              </div>
            )}

            {callStatus === "connected" && (
              <div className="mb-6 flex gap-4">
                <button
                  onClick={handleDisconnect}
                  className="rounded border border-red-500/50 bg-red-500/10 px-8 py-3 font-mono text-sm uppercase tracking-wide text-red-400 transition hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                >
                  End Call
                </button>
                {displayIncident && !incidentApproved && (
                  <button
                    onClick={handleApproveIncident}
                    className="rounded border border-amber-500/50 bg-amber-500/10 px-8 py-3 font-mono text-sm uppercase tracking-wide text-amber-400 transition hover:bg-amber-500/20 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                  >
                    Approve Emergency
                  </button>
                )}
                {displayIncident && incidentApproved && (
                  <div className="flex items-center gap-2 rounded border border-cyan-500/50 bg-cyan-500/10 px-6 py-3">
                    <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    <span className="font-mono text-sm uppercase tracking-wide text-cyan-400">Emergency Approved</span>
                  </div>
                )}
              </div>
            )}

          {/* Two-Column Layout for Incident Data - Always visible */}
          {(
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* Left Column: Patient & Location Data (40%) */}
              <div className="space-y-6 lg:col-span-2">
                {/* Patient Vitals */}
                <div className="rounded border border-cyan-500/30 bg-slate-900/50 p-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <h4 className="mb-4 border-b border-cyan-500/20 pb-2 font-mono text-xs uppercase tracking-wider text-cyan-400">
                    Patient Vitals
                  </h4>
                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="text-gray-100">
                        {displayIncident?.firstName ?? displayIncident?.lastName
                          ? `${displayIncident?.firstName ?? ''} ${displayIncident?.lastName ?? ''}`.trim()
                          : <span className="text-gray-600 italic">-</span>
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Age:</span>
                      <span className="text-gray-100">
                        {displayIncident?.patientAge ?? <span className="text-gray-600 italic">-</span>}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sex:</span>
                      <span className="text-gray-100">
                        {displayIncident?.patientSex ?? <span className="text-gray-600 italic">-</span>}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-cyan-500/10 pt-3">
                      <span className="text-gray-500">Consciousness:</span>
                      <span className={displayIncident?.consciousness ? "text-cyan-300" : "text-gray-600 italic"}>
                        {displayIncident?.consciousness ?? '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Breathing:</span>
                      <span className={displayIncident?.breathing ? "text-cyan-300" : "text-gray-600 italic"}>
                        {displayIncident?.breathing ?? '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">AVDI:</span>
                      <span className={displayIncident?.avdi ? "text-cyan-300" : "text-gray-600 italic"}>
                        {displayIncident?.avdi ?? '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Respiratory:</span>
                      <span className={displayIncident?.respiratoryStatus ? "text-cyan-300" : "text-gray-600 italic"}>
                        {displayIncident?.respiratoryStatus ?? '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="rounded border border-cyan-500/30 bg-slate-900/50 p-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <h4 className="mb-4 border-b border-cyan-500/20 pb-2 font-mono text-xs uppercase tracking-wider text-cyan-400">
                    Location
                  </h4>
                  <div className="space-y-3 font-mono text-sm">
                    <div>
                      <span className="text-gray-500">Address:</span>
                      <div className="mt-1 text-gray-100">
                        {displayIncident?.address ?? <span className="text-gray-600 italic">-</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">District:</span>
                      <div className="mt-1 text-gray-100">
                        {displayIncident?.district ?? <span className="text-gray-600 italic">-</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Apt/Unit:</span>
                      <div className="mt-1 text-gray-100">
                        {displayIncident?.apartment ?? <span className="text-gray-600 italic">-</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Reference:</span>
                      <div className="mt-1 text-gray-100">
                        {displayIncident?.reference ?? <span className="text-gray-600 italic">-</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Details */}
                <div className="rounded border border-cyan-500/30 bg-slate-900/50 p-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <h4 className="mb-4 border-b border-cyan-500/20 pb-2 font-mono text-xs uppercase tracking-wider text-cyan-400">
                    Medical Info
                  </h4>
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <span className="text-gray-500">Symptom Onset:</span>
                      <div className="mt-1 text-gray-100">
                        {displayIncident?.symptomOnset ?? <span className="text-gray-600 italic">-</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">History:</span>
                      <div className="mt-1 text-gray-100">
                        {displayIncident?.medicalHistory ?? <span className="text-gray-600 italic">-</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Medications:</span>
                      <div className="mt-1 text-gray-100">
                        {displayIncident?.currentMedications ?? <span className="text-gray-600 italic">-</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Allergies:</span>
                      <div className={displayIncident?.allergies ? "mt-1 text-amber-300" : "mt-1 text-gray-600 italic"}>
                        {displayIncident?.allergies ?? '-'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Vital Signs:</span>
                      <div className="mt-1 text-gray-100">
                        {displayIncident?.vitalSigns ?? <span className="text-gray-600 italic">-</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Transcript (60%) */}
              <div className="lg:col-span-3">
                <div className="rounded border border-cyan-500/30 bg-slate-900/50 p-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <h4 className="mb-4 border-b border-cyan-500/20 pb-2 font-mono text-xs uppercase tracking-wider text-cyan-400">
                    {callStatus === "connected" ? "Live Transcript" : "Call Transcript"}
                  </h4>
                  <div className="h-[600px] overflow-y-auto rounded border border-cyan-500/10 bg-black/50 p-6">
                    {displayIncident?.fullTranscript ? (
                      <div className="space-y-4">
                        {displayIncident.fullTranscript.split('\n').filter(line => line.trim()).map((line, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border-l-4 border-cyan-500/30 bg-slate-800/30 p-4 text-base leading-relaxed text-gray-100"
                          >
                            {line.trim()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          {callStatus === "connected" ? (
                            <>
                              <div className="mb-2 h-3 w-3 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                              <p className="font-mono text-sm text-gray-600 italic">Waiting for transcript...</p>
                            </>
                          ) : (
                            <p className="font-mono text-sm text-gray-600 italic">No transcript available</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        )}

        {/* === INCIDENTS HISTORY SECTION === */}
        <div className="mb-8">
          <h2 className="mb-6 border-b border-cyan-900/50 pb-3 font-mono text-xl uppercase tracking-wide text-cyan-400">
            Recent Incidents
          </h2>

          {recentIncidents && recentIncidents.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentIncidents.map((inc) => (
                <div
                  key={inc._id}
                  className="rounded-lg border border-cyan-500/30 bg-slate-900/50 p-4 shadow-lg transition hover:border-cyan-500/50 hover:shadow-cyan-500/10"
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between border-b border-cyan-500/20 pb-2">
                    <div>
                      <div className="font-mono text-xs text-gray-500">
                        {inc.lastUpdated
                          ? new Date(inc.lastUpdated).toLocaleString('es-CL')
                          : 'No date'}
                      </div>
                      <div className="mt-1 font-semibold text-gray-100">
                        {inc.firstName ?? ''} {inc.lastName ?? ''}
                        {!inc.firstName && !inc.lastName && <span className="text-gray-500 italic">Unknown</span>}
                      </div>
                    </div>
                    <div
                      className={`rounded px-2 py-1 font-mono text-xs ${
                        inc.priority === 'critical'
                          ? 'bg-red-500/20 text-red-400'
                          : inc.priority === 'high'
                            ? 'bg-orange-500/20 text-orange-400'
                            : inc.priority === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {inc.priority?.toUpperCase()}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="space-y-2 text-sm">
                    {inc.address && (
                      <div>
                        <span className="font-mono text-xs text-gray-500">📍 </span>
                        <span className="text-gray-300">{inc.address}</span>
                      </div>
                    )}
                    {inc.consciousness && (
                      <div>
                        <span className="font-mono text-xs text-gray-500">🧠 </span>
                        <span className="text-cyan-300">{inc.consciousness}</span>
                      </div>
                    )}
                    {inc.breathing && (
                      <div>
                        <span className="font-mono text-xs text-gray-500">💨 </span>
                        <span className="text-cyan-300">{inc.breathing}</span>
                      </div>
                    )}
                    {inc.description && (
                      <div className="mt-2 truncate text-xs text-gray-400">
                        {inc.description}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-3 border-t border-cyan-500/10 pt-2">
                    <div className="font-mono text-xs text-gray-600">
                      Status: <span className="text-gray-400">{inc.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-700/50 bg-slate-900/30 p-12 text-center">
              <p className="font-mono text-gray-600 italic">No incidents recorded yet</p>
            </div>
          )}
        </div>

        {/* System Logs */}
        <div className="mt-6 w-full">
          <div className="rounded border border-gray-700/50 bg-slate-900/30 p-4">
            <h3 className="mb-3 border-b border-gray-700/50 pb-2 font-mono text-xs uppercase tracking-wider text-gray-500">
              System Logs
            </h3>
            <div className="h-32 overflow-y-auto rounded border border-gray-800/50 bg-black/30 p-3 font-mono text-xs text-cyan-500/70">
              {logs.length === 0 ? (
                <span className="text-gray-700 italic">
                  System logs will appear here...
                </span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="mb-1 opacity-80 hover:opacity-100">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
