"use client";

import { useEffect, useState, useCallback } from "react";
import { Device, type Call } from "@twilio/voice-sdk";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../convex/_generated/dataModel";
import { DataField } from "../components/DataField";
import { DashboardCharts } from "../components/DashboardCharts";
import { AudioVisualizer } from "../components/AudioVisualizer";

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
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<Id<"incidents"> | null>(null);
  const selectedIncident = useQuery(
    api.incidents.get,
    selectedIncidentId ? { id: selectedIncidentId } : "skip"
  );
  const [selectedIncidentPreview, setSelectedIncidentPreview] = useState<typeof incident>(null);
  const [urgentLoadingId, setUrgentLoadingId] = useState<Id<"incidents"> | null>(null);

  // Mock stats - dynamic emergency statistics
  // Use fixed initial values to prevent hydration mismatch
  const [mockStats, setMockStats] = useState({
    active: 15,
    critical: 4,
    units: 10,
    total: 25,
  });

  // Initialize with random values only on client side after mount
  useEffect(() => {
    setMockStats({
      active: 12 + Math.floor(Math.random() * 8), // 12-19
      critical: 3 + Math.floor(Math.random() * 4), // 3-6
      units: 8 + Math.floor(Math.random() * 6), // 8-13
      total: 20 + Math.floor(Math.random() * 15), // 20-34
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMockStats(prev => ({
        active: Math.max(5, Math.min(25, prev.active + Math.floor((Math.random() - 0.5) * 4))),
        critical: Math.max(0, Math.min(10, prev.critical + Math.floor((Math.random() - 0.5) * 2))),
        units: Math.max(3, Math.min(18, prev.units + Math.floor((Math.random() - 0.5) * 3))),
        total: Math.max(15, Math.min(50, prev.total + Math.floor((Math.random() - 0.5) * 3))),
      }));
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Use mocked stats instead of calculated ones
  const stats = mockStats;

  // Use active incident if available, otherwise show selected incident, otherwise show persisted data
  const displayIncident =
    incident ?? selectedIncident ?? selectedIncidentPreview ?? persistedIncident;

  // Check if incident has assignment
  const getAssignmentByIncident = useQuery(
    api.incidentAssignments.getByIncident,
    displayIncident?._id ? { incidentId: displayIncident._id } : "skip"
  );

  // Show skeleton loaders after 2 seconds of accepting call
  useEffect(() => {
    if (callStatus === "connected") {
      const timer = setTimeout(() => {
        setShowSkeletons(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowSkeletons(false);
    }
  }, [callStatus]);


  // Persist incident data when it updates
  useEffect(() => {
    if (incident) {
      setPersistedIncident(incident);
      console.log("[IncidentSelect] Active incident updated", incident?._id);
    }
  }, [incident]);

  useEffect(() => {
    if (selectedIncidentId) {
      console.log("[IncidentSelect] selectedIncidentId effect", {
        selectedIncidentId,
        preview: selectedIncidentPreview?._id,
      });
    }
  }, [selectedIncidentId, selectedIncidentPreview?._id]);

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

  const handleSelectIncident = (incidentData: Doc<"incidents">) => {
    console.log("[IncidentSelect] Card click", incidentData._id);
    setSelectedIncidentId(incidentData._id);
    setSelectedIncidentPreview(incidentData);
    setIncidentApproved(false); // Reset approval state when selecting a new incident
    addLog(`Selected incident: ${incidentData._id}`);
    console.log("[IncidentSelect] State update queued", {
      selectedIncidentId: incidentData._id,
      hasTranscript: Boolean(incidentData.liveTranscript),
    });
    // Scroll to top to show the incident details
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleMarkUrgent = async (incidentId: Id<"incidents">) => {
    setUrgentLoadingId(incidentId);
    addLog(`Marking incident ${incidentId} as urgent...`);
    try {
      await createPendingAssignment({ incidentId });
      addLog(`Incident ${incidentId} escalated to urgent assignment`);
    } catch (e) {
      addLog(`Error escalating incident ${incidentId}: ${e as string}`);
    } finally {
      setUrgentLoadingId(null);
    }
  };

  // Check if incident has assignment (either from query or from state)
  const hasAssignment = (getAssignmentByIncident !== undefined && getAssignmentByIncident !== null) || incidentApproved;

  return (
    <main className="min-h-screen bg-[#FFF2DC] bg-grid-pattern p-6 text-[#1A1A1A]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 border-b border-[#E6DAC7] pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-wide text-[#1A1A1A]">EMERGENCY DISPATCH SYSTEM</h1>
              <p className="mt-1 font-mono text-sm text-[#1A1A1A]/80">
                {identity ? `OPERATOR: ${identity}` : "INITIALIZING..."}
              </p>
            </div>
            <div className={`flex items-center gap-3 rounded border px-4 py-2 font-mono text-sm ${
              callStatus === "incoming"
                ? "animate-pulse border-amber-600/40 bg-amber-50 text-amber-700"
                : callStatus === "connected"
                  ? "border-[#1A1A1A]/30 bg-[#FFFAF1] text-[#1A1A1A] shadow-[0_2px_8px_rgba(26,26,26,0.15)]"
                  : callStatus === "ready"
                    ? "border-[#E6DAC7] bg-[#FFFAF1] text-[#1A1A1A]/80"
                    : "border-red-600/40 bg-red-50 text-red-700"
            }`}>
              <div className={`h-2 w-2 rounded-full ${
                callStatus === "incoming" ? "bg-amber-600 animate-pulse" :
                callStatus === "connected" ? "bg-[#1A1A1A] shadow-[0_0_8px_rgba(26,26,26,0.4)]" :
                callStatus === "ready" ? "bg-[#1A1A1A]/50" : "bg-red-600"
              }`} />
              STATUS: {callStatus.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Dispatcher Selection - Only show when not connected */}
        {callStatus !== "connected" && (
          <div className="mb-6 w-full max-w-md">
            <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-[#1A1A1A]/80">
              Dispatcher
            </label>
            <select
              className="w-full rounded border border-[#E6DAC7] bg-[#FFFAF1] p-3 font-mono text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
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
          <>
            {/* Close button when viewing selected incident */}
            {selectedIncidentId && callStatus !== "connected" && callStatus !== "incoming" && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    setSelectedIncidentId(null);
                    setSelectedIncidentPreview(null);
                    setIncidentApproved(false);
                    addLog("Closed incident view");
                  }}
                  className="rounded border border-[#E6DAC7] bg-[#FFFAF1] px-4 py-2 font-mono text-xs uppercase tracking-wide text-[#1A1A1A] transition hover:bg-[#E6DAC7]/30 hover:shadow-[0_2px_8px_rgba(26,26,26,0.1)]"
                >
                  ← Close Incident View
                </button>
              </div>
            )}
          <div className="mb-8">
            {/* Call Controls */}
            {callStatus === "incoming" && (
              <div className="mb-6 flex gap-4">
                <button
                  onClick={handleAccept}
                  className="flex-1 rounded border border-[#1A1A1A]/30 bg-[#FFFAF1] px-8 py-4 font-mono text-sm uppercase tracking-wide text-[#1A1A1A] transition hover:bg-[#E6DAC7]/30 hover:shadow-[0_2px_8px_rgba(26,26,26,0.2)]"
                >
                  Accept Call
                </button>
                <button
                  onClick={handleDecline}
                  className="flex-1 rounded border border-red-600/40 bg-red-50 px-8 py-4 font-mono text-sm uppercase tracking-wide text-red-700 transition hover:bg-red-100 hover:shadow-[0_2px_8px_rgba(220,38,38,0.2)]"
                >
                  Decline
                </button>
              </div>
            )}

            {(callStatus === "connected" || selectedIncidentId) && (
              <div className="mb-6 flex gap-4">
                {callStatus === "connected" && (
                  <button
                    onClick={handleDisconnect}
                    className="rounded border border-red-600/40 bg-red-50 px-8 py-3 font-mono text-sm uppercase tracking-wide text-red-700 transition hover:bg-red-100 hover:shadow-[0_2px_8px_rgba(220,38,38,0.2)]"
                  >
                    End Call
                  </button>
                )}
                {displayIncident && !hasAssignment && (
                  <button
                    onClick={handleApproveIncident}
                    className="rounded border border-amber-600/40 bg-amber-50 px-8 py-3 font-mono text-sm uppercase tracking-wide text-amber-700 transition hover:bg-amber-100 hover:shadow-[0_2px_8px_rgba(217,119,6,0.2)]"
                  >
                    Approve Emergency
                  </button>
                )}
                {displayIncident && hasAssignment && (
                  <div className="flex items-center gap-2 rounded border border-[#1A1A1A]/30 bg-[#FFFAF1] px-6 py-3">
                    <div className="h-2 w-2 rounded-full bg-[#1A1A1A] shadow-[0_0_8px_rgba(26,26,26,0.4)]" />
                    <span className="font-mono text-sm uppercase tracking-wide text-[#1A1A1A]">Emergency Approved</span>
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
                <div className="glass-card rounded-lg p-5">
                  <h4 className="mb-4 border-b border-[#E6DAC7] pb-2 font-mono text-xs uppercase tracking-wider text-[#1A1A1A]">
                    Patient Vitals
                  </h4>
                  <div className="space-y-3">
                    {/* Name - full width */}
                    <DataField
                      label="Name"
                      value={displayIncident?.firstName ?? displayIncident?.lastName ? `${displayIncident.firstName ?? ''} ${displayIncident.lastName ?? ''}`.trim() : null}
                      isLoading={showSkeletons && !displayIncident?.firstName}
                      isCritical={true}
                    />
                    {/* Age and Sex - 2 columns */}
                    <div className="grid grid-cols-2 gap-3">
                      <DataField
                        label="Age"
                        value={displayIncident?.patientAge}
                        isLoading={showSkeletons && !displayIncident?.patientAge}
                      />
                      <DataField
                        label="Sex"
                        value={displayIncident?.patientSex}
                        isLoading={showSkeletons && !displayIncident?.patientSex}
                      />
                    </div>
                    {/* Breathing and AVDI - 2 columns */}
                    <div className="grid grid-cols-2 gap-3">
                      <DataField
                        label="Breathing"
                        value={displayIncident?.breathing}
                        isLoading={showSkeletons && !displayIncident?.breathing}
                      />
                      <DataField
                        label="AVDI"
                        value={displayIncident?.avdi}
                        isLoading={showSkeletons && !displayIncident?.avdi}
                      />
                    </div>
                    {/* Consciousness and Respiratory - 2 columns with border */}
                    <div className="border-t border-[#E6DAC7] pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <DataField
                          label="Consciousness"
                          value={displayIncident?.consciousness}
                          isLoading={showSkeletons && !displayIncident?.consciousness}
                          className={displayIncident?.consciousness ? "text-[#1A1A1A]" : ""}
                        />
                        <DataField
                          label="Respiratory"
                          value={displayIncident?.respiratoryStatus}
                          isLoading={showSkeletons && !displayIncident?.respiratoryStatus}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="glass-card rounded-lg p-5">
                  <h4 className="mb-4 border-b border-[#E6DAC7] pb-2 font-mono text-xs uppercase tracking-wider text-[#1A1A1A]">
                    Location
                  </h4>
                  <div className="space-y-3">
                    {/* Address - full width */}
                    <DataField
                      label="Address"
                      value={displayIncident?.address}
                      isLoading={showSkeletons && !displayIncident?.address}
                      isCritical={true}
                    />
                    {/* District and Apt/Unit - 2 columns */}
                    <div className="grid grid-cols-2 gap-3">
                      <DataField
                        label="District"
                        value={displayIncident?.district}
                        isLoading={showSkeletons && !displayIncident?.district}
                      />
                      <DataField
                        label="Apt/Unit"
                        value={displayIncident?.apartment}
                        isLoading={showSkeletons && !displayIncident?.apartment}
                      />
                    </div>
                    {/* Reference - full width */}
                    <DataField
                      label="Reference"
                      value={displayIncident?.reference}
                      isLoading={showSkeletons && !displayIncident?.reference}
                    />
                  </div>
                </div>

                {/* Medical Details */}
                <div className="glass-card rounded-lg p-5">
                  <h4 className="mb-4 border-b border-[#E6DAC7] pb-2 font-mono text-xs uppercase tracking-wider text-[#1A1A1A]">
                    Medical Info
                  </h4>
                  <div className="space-y-3">
                    <DataField
                      label="Symptom Onset"
                      value={displayIncident?.symptomOnset}
                      isLoading={showSkeletons && !displayIncident?.symptomOnset}
                    />
                    <DataField
                      label="History"
                      value={displayIncident?.medicalHistory}
                      isLoading={showSkeletons && !displayIncident?.medicalHistory}
                    />
                    <DataField
                      label="Medications"
                      value={displayIncident?.currentMedications}
                      isLoading={showSkeletons && !displayIncident?.currentMedications}
                    />
                    {/* Allergies and Vital Signs - 2 columns */}
                    <div className="grid grid-cols-2 gap-3">
                      <DataField
                        label="Allergies"
                        value={displayIncident?.allergies}
                        isLoading={showSkeletons && !displayIncident?.allergies}
                        className={displayIncident?.allergies ? "text-amber-700" : ""}
                      />
                      <DataField
                        label="Vital Signs"
                        value={displayIncident?.vitalSigns}
                        isLoading={showSkeletons && !displayIncident?.vitalSigns}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Transcript (60%) */}
              <div className="lg:col-span-3">
                <div className="glass-card flex h-full flex-col rounded-lg p-1 shadow-[0_2px_12px_rgba(26,26,26,0.08)]">
                  <div className="border-b border-[#E6DAC7] p-4">
                     <div className="flex items-center justify-between">
                      <h4 className="font-mono text-xs uppercase tracking-wider text-[#1A1A1A]">
                        {callStatus === "connected" ? "Live Audio Feed" : "Transcript Log"}
                      </h4>
                      {callStatus === "connected" && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-red-600"></span>
                          <span className="font-mono text-[10px] text-red-700">RECORDING</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative flex-1 overflow-hidden bg-[#FFFAF1]/50 p-6">
                    {/* Audio Visualizer - shown when call is connected at the top */}
                    {callStatus === "connected" && (
                      <AudioVisualizer isActive={callStatus === "connected"} />
                    )}
                    
                    {/* Fade out mask at top (below visualizer) */}
                    <div className={`pointer-events-none absolute left-0 z-10 w-full bg-gradient-to-b from-[#FFFAF1] to-transparent ${callStatus === "connected" ? "top-24 h-12" : "top-0 h-12"}`} />
                    
                    <div className={`h-[600px] space-y-4 overflow-y-auto pr-2 ${callStatus === "connected" ? "pt-28 pb-4" : "pt-0 pb-4"}`}>
                      {displayIncident?.liveTranscript ? (
                        <>
                          {(() => {
                            // Separar por frases (punto seguido de espacio o punto final)
                            const sentences = displayIncident.liveTranscript
                              .split(/(?<=[.!?])\s+/)
                              .filter(s => s.trim());

                            // Agrupar cada 2 frases como un "mensaje"
                            const messages = [];
                            for (let i = 0; i < sentences.length; i += 2) {
                              const message = sentences.slice(i, i + 2).join(' ');
                              if (message.trim()) messages.push(message);
                            }

                            return messages.map((message, idx) => (
                              <div
                                key={idx}
                                className={`animate-fade-in-up relative rounded-xl border border-[#E6DAC7]/40 bg-[#FFFAF1]/80 p-4 backdrop-blur-md transition-all hover:border-[#E6DAC7]/60 hover:bg-[#FFFAF1] ${
                                  idx === messages.length - 1 ? "border-[#1A1A1A]/30 shadow-[0_2px_8px_rgba(26,26,26,0.1)]" : ""
                                }`}
                              >
                                {/* Message Index/Time decoration */}
                                <div className="absolute -left-3 top-4 flex items-center">
                                  <div className="h-px w-3 bg-[#E6DAC7]" />
                                  <div className={`h-1.5 w-1.5 rounded-full ${
                                    idx === messages.length - 1 ? "animate-pulse bg-[#1A1A1A]" : "bg-[#E6DAC7]"
                                  }`} />
                                </div>
                                
                                <p className="font-mono text-sm leading-relaxed text-[#1A1A1A]">
                                  {message.trim()}
                                </p>
                              </div>
                            ));
                          })()}
                          {/* Scrolling anchor */}
                          <div className="h-4" /> 
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            {callStatus === "connected" ? (
                              <div className="flex flex-col items-center gap-4">
                                <div className="relative h-12 w-12">
                                  <div className="absolute inset-0 animate-ping rounded-full bg-[#1A1A1A]/20" />
                                  <div className="absolute inset-0 animate-pulse rounded-full border border-[#1A1A1A]/30" />
                                  <div className="absolute inset-3 animate-spin rounded-full border-t-2 border-[#1A1A1A]" />
                                </div>
                                <p className="font-mono text-sm text-[#1A1A1A]/80">AWAITING AUDIO STREAM...</p>
                              </div>
                            ) : (
                              <p className="font-mono text-sm text-[#1A1A1A]/60">NO TRANSCRIPT DATA</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
          </>
        )}

        {/* === INCIDENTS HISTORY SECTION === */}
        <div className="mb-8">
          {/* Dashboard Stats */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card flex flex-col justify-between rounded-lg p-5">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-[#1A1A1A]/80">Active Incidents</span>
                <div className="h-2 w-2 animate-pulse rounded-full bg-[#1A1A1A] shadow-[0_0_8px_rgba(26,26,26,0.3)]" />
              </div>
              <div className="mt-2">
                <span className="font-mono text-4xl font-light text-[#1A1A1A]" suppressHydrationWarning>{stats.active}</span>
              </div>
            </div>

            <div className="glass-card flex flex-col justify-between rounded-lg border-red-600/20 p-5 shadow-[0_2px_8px_rgba(220,38,38,0.08)]">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-red-700/70">Critical Alerts</span>
                {stats.critical > 0 && (
                  <div className="h-2 w-2 animate-[ping_1.5s_linear_infinite] rounded-full bg-red-600 opacity-75" />
                )}
              </div>
              <div className="mt-2">
                <span className="font-mono text-4xl font-light text-red-700" suppressHydrationWarning>{stats.critical}</span>
              </div>
            </div>

            <div className="glass-card flex flex-col justify-between rounded-lg border-amber-600/20 p-5 shadow-[0_2px_8px_rgba(217,119,6,0.08)]">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-amber-700/70">Units Deployed</span>
                <div className="h-2 w-2 rounded-full bg-amber-600/50" />
              </div>
              <div className="mt-2">
                <span className="font-mono text-4xl font-light text-amber-700" suppressHydrationWarning>{stats.units}</span>
              </div>
            </div>

            <div className="glass-card flex flex-col justify-between rounded-lg border-[#E6DAC7] p-5">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-[#1A1A1A]/70">Total (24h)</span>
                <div className="h-2 w-2 rounded-full bg-[#E6DAC7]" />
              </div>
              <div className="mt-2">
                <span className="font-mono text-4xl font-light text-[#1A1A1A]/90" suppressHydrationWarning>{stats.total}</span>
              </div>
            </div>
          </div>

          {/* Crazy Charts Section */}
          <div className="mb-8">
            <DashboardCharts />
          </div>

          <h2 className="mb-6 border-b border-[#E6DAC7] pb-3 font-mono text-xl uppercase tracking-wide text-[#1A1A1A]">
            Recent Incidents
          </h2>

          {recentIncidents && recentIncidents.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentIncidents.map((inc) => (
                <div
                  key={inc._id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectIncident(inc);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectIncident(inc);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer rounded-lg border border-[#E6DAC7] bg-[#FFFAF1]/80 p-4 shadow-lg transition hover:border-[#1A1A1A]/30 hover:shadow-[0_4px_12px_rgba(26,26,26,0.1)] active:scale-[0.98]"
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between border-b border-[#E6DAC7] pb-2">
                    <div>
                      <div className="font-mono text-xs text-[#1A1A1A]/70">
                        {inc.lastUpdated
                          ? new Date(inc.lastUpdated).toLocaleString('es-CL')
                          : 'No date'}
                      </div>
                      <div className="mt-1 font-semibold text-[#1A1A1A]">
                        {inc.firstName ?? ''} {inc.lastName ?? ''}
                        {!inc.firstName && !inc.lastName && <span className="text-[#1A1A1A]/60 italic">Unknown</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div
                        className={`rounded px-2 py-1 font-mono text-xs ${
                          inc.priority === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : inc.priority === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : inc.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-[#E6DAC7] text-[#1A1A1A]/80'
                        }`}
                      >
                        {inc.priority?.toUpperCase()}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void handleMarkUrgent(inc._id);
                        }}
                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          urgentLoadingId === inc._id
                            ? 'border-amber-400 bg-amber-50 text-amber-700 opacity-80'
                            : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {urgentLoadingId === inc._id ? 'Enviando...' : 'Urgente'}
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="space-y-2 text-sm">
                    {inc.address && (
                      <div>
                        <span className="font-mono text-xs text-[#1A1A1A]/70">📍 </span>
                        <span className="text-[#1A1A1A]">{inc.address}</span>
                      </div>
                    )}
                    {inc.consciousness && (
                      <div>
                        <span className="font-mono text-xs text-[#1A1A1A]/70">🧠 </span>
                        <span className="text-[#1A1A1A]">{inc.consciousness}</span>
                      </div>
                    )}
                    {inc.breathing && (
                      <div>
                        <span className="font-mono text-xs text-[#1A1A1A]/70">💨 </span>
                        <span className="text-[#1A1A1A]">{inc.breathing}</span>
                      </div>
                    )}
                    {inc.description && (
                      <div className="mt-2 truncate text-xs text-[#1A1A1A]/80">
                        {inc.description}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-3 border-t border-[#E6DAC7] pt-2">
                    <div className="font-mono text-xs text-[#1A1A1A]/70">
                      Status: <span className="text-[#1A1A1A]/90">{inc.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[#E6DAC7] bg-[#FFFAF1]/50 p-12 text-center">
              <p className="font-mono text-[#1A1A1A]/70 italic">No incidents recorded yet</p>
            </div>
          )}
        </div>

        {/* System Logs */}
        <div className="mt-6 w-full">
          <div className="rounded border border-[#E6DAC7] bg-[#FFFAF1]/50 p-4">
            <h3 className="mb-3 border-b border-[#E6DAC7] pb-2 font-mono text-xs uppercase tracking-wider text-[#1A1A1A]/80">
              System Logs
            </h3>
            <div className="h-32 overflow-y-auto rounded border border-[#E6DAC7] bg-[#FFFAF1] p-3 font-mono text-xs text-[#1A1A1A]/80">
              {logs.length === 0 ? (
                <span className="text-[#1A1A1A]/60 italic">
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
