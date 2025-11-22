"use client";

import { useEffect, useState } from "react";
import { Device, type Call } from "@twilio/voice-sdk";

type CallStatus = "initializing" | "ready" | "incoming" | "connected" | "offline" | "error";

interface TokenResponse {
  identity: string;
  token: string;
}

export default function Home() {
  // device state is mainly for debugging/display, actual cleanup uses local var
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("initializing");
  const [identity, setIdentity] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const time = new Date().toISOString().split('T')[1]?.split('.')[0] ?? "00:00:00";
    setLogs((prev) => [...prev, `${time} - ${msg}`]);
    console.log(msg);
  };

  useEffect(() => {
    let mounted = true;
    let activeDevice: Device | null = null;

    const initDevice = async () => {
      try {
        addLog("Fetching access token...");
        const response = await fetch("/api/twilio/token");
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
          });

          call.on("cancel", () => {
             if (!mounted) return;
             addLog("Call canceled");
             setCallStatus("ready");
             setCurrentCall(null);
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
        activeDevice.destroy();
      }
    };
  }, []);

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
    }
  };

  const handleDisconnect = () => {
    if (currentCall) {
      addLog("Disconnecting call...");
      currentCall.disconnect();
      setCallStatus("ready");
      setCurrentCall(null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 text-gray-900">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Twilio Voice Agent</h1>
          <p className="opacity-90 mt-1">{identity ? `Logged in as: ${identity}` : "Initializing..."}</p>
        </div>

        <div className="p-8 flex flex-col items-center gap-6">
          <div className={`text-xl font-semibold px-4 py-2 rounded-full ${
            callStatus === 'incoming' ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
            callStatus === 'connected' ? 'bg-green-100 text-green-700' :
            callStatus === 'ready' ? 'bg-gray-100 text-gray-600' :
            'bg-red-100 text-red-700'
          }`}>
            Status: {callStatus.toUpperCase()}
          </div>

          {callStatus === "incoming" && (
            <div className="flex gap-4 w-full justify-center">
              <button
                onClick={handleAccept}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition shadow-md"
              >
                Accept
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition shadow-md"
              >
                Decline
              </button>
            </div>
          )}

          {callStatus === "connected" && (
            <div className="w-full">
               <button
                onClick={handleDisconnect}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-md"
              >
                Hang Up
              </button>
            </div>
          )}

          <div className="w-full border-t pt-4 mt-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Logs</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono h-48 overflow-y-auto">
              {logs.length === 0 ? (
                <span className="opacity-50">System logs will appear here...</span>
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
