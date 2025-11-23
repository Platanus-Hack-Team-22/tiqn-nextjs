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
    if (!incident?._id) {
      addLog("No incident to approve");
      return;
    }

    try {
      addLog("Approving incident as true emergency...");
      await createPendingAssignment({ incidentId: incident._id });
      setIncidentApproved(true);
      addLog("Incident approved! Assignment created with pending status.");
    } catch (e) {
      addLog(`Error approving incident: ${e as string}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-gray-900">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="bg-blue-600 p-6 text-center text-white">
          <h1 className="text-2xl font-bold">Twilio Voice Agent</h1>
          <p className="mt-1 opacity-90">
            {identity ? `Logged in as: ${identity}` : "Initializing..."}
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 p-8">
          {/* Dispatcher Selection */}
          <div className="w-full">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Dispatcher
            </label>
            <select
              className="w-full rounded-md border bg-white p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
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

          <div
            className={`rounded-full px-4 py-2 text-xl font-semibold ${
              callStatus === "incoming"
                ? "animate-pulse bg-yellow-100 text-yellow-700"
                : callStatus === "connected"
                  ? "bg-green-100 text-green-700"
                  : callStatus === "ready"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-red-100 text-red-700"
            }`}
          >
            Status: {callStatus.toUpperCase()}
          </div>

          {callStatus === "incoming" && (
            <div className="flex w-full justify-center gap-4">
              <button
                onClick={handleAccept}
                className="flex-1 rounded-lg bg-green-500 px-6 py-3 font-bold text-white shadow-md transition hover:bg-green-600"
              >
                Accept
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 rounded-lg bg-red-500 px-6 py-3 font-bold text-white shadow-md transition hover:bg-red-600"
              >
                Decline
              </button>
            </div>
          )}

          {callStatus === "connected" && (
            <div className="w-full">
              <button
                onClick={handleDisconnect}
                className="w-full rounded-lg bg-red-600 px-6 py-3 font-bold text-white shadow-md transition hover:bg-red-700"
              >
                Hang Up
              </button>
            </div>
          )}

          {callStatus === "connected" && incident && !incidentApproved && (
            <div className="w-full">
              <button
                onClick={handleApproveIncident}
                className="w-full rounded-lg bg-yellow-500 px-6 py-3 font-bold text-white shadow-md transition hover:bg-yellow-600"
              >
                Approve This Incident
              </button>
            </div>
          )}

          {callStatus === "connected" && incident && incidentApproved && (
            <div className="w-full rounded-lg bg-green-100 border border-green-300 px-4 py-2 text-center">
              <span className="text-green-700 font-semibold">✓ Incident Approved</span>
            </div>
          )}

          {callStatus === "connected" && incident && (
            <div className="w-full space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Incident Data</h3>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <h4 className="mb-2 text-xs font-semibold uppercase text-blue-700">Patient Info</h4>
                <div className="space-y-1 text-sm">
                  {incident.firstName || incident.lastName ? (
                    <div><span className="font-medium">Name:</span> {incident.firstName} {incident.lastName}</div>
                  ) : <div className="text-gray-400 italic">Name: Not provided</div>}
                  {incident.patientAge && <div><span className="font-medium">Age:</span> {incident.patientAge}</div>}
                  {incident.patientSex && <div><span className="font-medium">Sex:</span> {incident.patientSex}</div>}
                  {incident.consciousness && <div><span className="font-medium">Consciousness:</span> {incident.consciousness}</div>}
                  {incident.breathing && <div><span className="font-medium">Breathing:</span> {incident.breathing}</div>}
                </div>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <h4 className="mb-2 text-xs font-semibold uppercase text-green-700">Location</h4>
                <div className="space-y-1 text-sm">
                  {incident.address ? (
                    <div><span className="font-medium">Address:</span> {incident.address}</div>
                  ) : <div className="text-gray-400 italic">Address: Not provided</div>}
                  {incident.district && <div><span className="font-medium">District:</span> {incident.district}</div>}
                  {incident.apartment && <div><span className="font-medium">Apt/Unit:</span> {incident.apartment}</div>}
                  {incident.reference && <div><span className="font-medium">Reference:</span> {incident.reference}</div>}
                </div>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <h4 className="mb-2 text-xs font-semibold uppercase text-orange-700">Medical Status</h4>
                <div className="space-y-1 text-sm">
                  {incident.avdi && <div><span className="font-medium">AVDI:</span> {incident.avdi}</div>}
                  {incident.respiratoryStatus && <div><span className="font-medium">Respiratory:</span> {incident.respiratoryStatus}</div>}
                  {incident.symptomOnset && <div><span className="font-medium">Symptom Onset:</span> {incident.symptomOnset}</div>}
                  {incident.medicalHistory && <div><span className="font-medium">History:</span> {incident.medicalHistory}</div>}
                  {incident.currentMedications && <div><span className="font-medium">Medications:</span> {incident.currentMedications}</div>}
                  {incident.allergies && <div><span className="font-medium">Allergies:</span> {incident.allergies}</div>}
                  {incident.vitalSigns && <div><span className="font-medium">Vital Signs:</span> {incident.vitalSigns}</div>}
                  {!incident.avdi && !incident.respiratoryStatus && !incident.symptomOnset && !incident.medicalHistory && !incident.currentMedications && !incident.allergies && !incident.vitalSigns && (
                    <div className="text-gray-400 italic">Extracting medical data...</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 w-full border-t pt-4">
            <h3 className="mb-2 text-sm font-medium text-gray-500">Logs</h3>
            <div className="h-48 overflow-y-auto rounded-lg bg-gray-900 p-4 font-mono text-xs text-green-400">
              {logs.length === 0 ? (
                <span className="opacity-50">
                  System logs will appear here...
                </span>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
