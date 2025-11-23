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

        <div className="flex flex-col gap-6">
          {/* Dispatcher Selection - Only show when not connected */}
          {callStatus !== "connected" && (
            <div className="w-full max-w-md">
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

          {/* Call Controls */}
          {callStatus === "incoming" && (
            <div className="flex gap-4">
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
            <div className="flex gap-4">
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
                  {displayIncident ? (
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name:</span>
                        <span className="text-gray-100">
                          {displayIncident.firstName ?? displayIncident.lastName
                            ? `${displayIncident.firstName ?? ''} ${displayIncident.lastName ?? ''}`.trim()
                            : <span className="text-gray-600 italic">Unknown</span>
                          }
                        </span>
                      </div>
                      {displayIncident.patientAge && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Age:</span>
                          <span className="text-gray-100">{displayIncident.patientAge}</span>
                        </div>
                      )}
                      {displayIncident.patientSex && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sex:</span>
                          <span className="text-gray-100">{displayIncident.patientSex}</span>
                        </div>
                      )}
                      {displayIncident.consciousness && (
                        <div className="flex justify-between border-t border-cyan-500/10 pt-3">
                          <span className="text-gray-500">Consciousness:</span>
                          <span className="text-cyan-300">{displayIncident.consciousness}</span>
                        </div>
                      )}
                      {displayIncident.breathing && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Breathing:</span>
                          <span className="text-cyan-300">{displayIncident.breathing}</span>
                        </div>
                      )}
                      {displayIncident.avdi && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">AVDI:</span>
                          <span className="text-cyan-300">{displayIncident.avdi}</span>
                        </div>
                      )}
                      {displayIncident.respiratoryStatus && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Respiratory:</span>
                          <span className="text-cyan-300">{displayIncident.respiratoryStatus}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="font-mono text-sm text-gray-600 italic">No patient data available</p>
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="rounded border border-cyan-500/30 bg-slate-900/50 p-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <h4 className="mb-4 border-b border-cyan-500/20 pb-2 font-mono text-xs uppercase tracking-wider text-cyan-400">
                    Location
                  </h4>
                  {displayIncident ? (
                    <div className="space-y-3 font-mono text-sm">
                      <div>
                        <span className="text-gray-500">Address:</span>
                        <div className="mt-1 text-gray-100">
                          {displayIncident.address ?? <span className="text-gray-600 italic">Not provided</span>}
                        </div>
                      </div>
                      {displayIncident.district && (
                        <div>
                          <span className="text-gray-500">District:</span>
                          <div className="mt-1 text-gray-100">{displayIncident.district}</div>
                        </div>
                      )}
                      {displayIncident.apartment && (
                        <div>
                          <span className="text-gray-500">Apt/Unit:</span>
                          <div className="mt-1 text-gray-100">{displayIncident.apartment}</div>
                        </div>
                      )}
                      {displayIncident.reference && (
                        <div>
                          <span className="text-gray-500">Reference:</span>
                          <div className="mt-1 text-gray-100">{displayIncident.reference}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="font-mono text-sm text-gray-600 italic">No location data available</p>
                    </div>
                  )}
                </div>

                {/* Medical Details */}
                <div className="rounded border border-cyan-500/30 bg-slate-900/50 p-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <h4 className="mb-4 border-b border-cyan-500/20 pb-2 font-mono text-xs uppercase tracking-wider text-cyan-400">
                    Medical Info
                  </h4>
                  {displayIncident ? (
                    <div className="space-y-3 font-mono text-xs">
                      {displayIncident.symptomOnset && (
                        <div>
                          <span className="text-gray-500">Symptom Onset:</span>
                          <div className="mt-1 text-gray-100">{displayIncident.symptomOnset}</div>
                        </div>
                      )}
                      {displayIncident.medicalHistory && (
                        <div>
                          <span className="text-gray-500">History:</span>
                          <div className="mt-1 text-gray-100">{displayIncident.medicalHistory}</div>
                        </div>
                      )}
                      {displayIncident.currentMedications && (
                        <div>
                          <span className="text-gray-500">Medications:</span>
                          <div className="mt-1 text-gray-100">{displayIncident.currentMedications}</div>
                        </div>
                      )}
                      {displayIncident.allergies && (
                        <div>
                          <span className="text-gray-500">Allergies:</span>
                          <div className="mt-1 text-amber-300">{displayIncident.allergies}</div>
                        </div>
                      )}
                      {displayIncident.vitalSigns && (
                        <div>
                          <span className="text-gray-500">Vital Signs:</span>
                          <div className="mt-1 text-gray-100">{displayIncident.vitalSigns}</div>
                        </div>
                      )}
                      {!displayIncident.symptomOnset && !displayIncident.medicalHistory && !displayIncident.currentMedications && !displayIncident.allergies && !displayIncident.vitalSigns && (
                        <div className="py-4 text-center text-gray-600 italic">Extracting medical data...</div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="font-mono text-sm text-gray-600 italic">No medical data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live Transcript (60%) */}
              <div className="lg:col-span-3">
                <div className="rounded border border-cyan-500/30 bg-slate-900/50 p-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <h4 className="mb-4 border-b border-cyan-500/20 pb-2 font-mono text-xs uppercase tracking-wider text-cyan-400">
                    {callStatus === "connected" ? "Live Transcript" : "Call Transcript"}
                  </h4>
                  <div className="h-[600px] overflow-y-auto rounded border border-cyan-500/10 bg-black/50 p-4">
                    {displayIncident?.fullTranscript ? (
                      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-cyan-100/90">
                        {displayIncident.fullTranscript}
                      </pre>
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
      </div>
    </main>
  );
}
