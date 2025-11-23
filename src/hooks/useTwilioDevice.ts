"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Device } from "@twilio/voice-sdk";
import type { Call } from "@twilio/voice-sdk";

type CallStatus = "initializing" | "ready" | "incoming" | "connected" | "disconnected" | "error";

type TokenResponse = {
  identity: string;
  token: string;
};

type UseTwilioDeviceOptions = {
  dispatcherId: string | null;
  onIncomingCall?: (call: Call, from: string) => void;
  onCallAccepted?: (call: Call) => void;
  onCallDisconnected?: () => void;
};

export function useTwilioDevice({
  dispatcherId,
  onIncomingCall,
  onCallAccepted,
  onCallDisconnected,
}: UseTwilioDeviceOptions) {
  const [callStatus, setCallStatus] = useState<CallStatus>("initializing");
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [identity, setIdentity] = useState<string>("");
  const deviceRef = useRef<Device | null>(null);

  // Play incoming call sound (ringtone-like beep)
  const playIncomingCallSound = useCallback(() => {
    try {
      // Create audio context if not already created
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Play a ringtone pattern: beep-beep-pause-beep-beep
      const playBeep = (delay: number, frequency: number) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = "sine";
          
          const now = audioContext.currentTime;
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          
          oscillator.start(now);
          oscillator.stop(now + 0.3);
        }, delay);
      };

      // Ring pattern: beep-beep-pause-beep-beep (repeat)
      playBeep(0, 800);
      playBeep(300, 800);
      playBeep(1000, 800);
      playBeep(1300, 800);
      
      // Repeat the pattern after 2 seconds
      setTimeout(() => {
        playBeep(0, 800);
        playBeep(300, 800);
        playBeep(1000, 800);
        playBeep(1300, 800);
      }, 2000);
    } catch (error) {
      console.error("Error playing incoming call sound:", error);
    }
  }, []);

  // Initialize Device when dispatcherId is available
  useEffect(() => {
    if (!dispatcherId) {
      setCallStatus("initializing");
      return;
    }

    let mounted = true;
    let activeDevice: Device | null = null;

    const initDevice = async () => {
      try {
        // Fetch access token
        const response = await fetch(`/api/twilio/token?identity=${dispatcherId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch token: ${response.statusText}`);
        }
        const data = (await response.json()) as TokenResponse;
        
        if (!mounted) return;

        setIdentity(data.identity);

        const newDevice = new Device(data.token, {
          logLevel: 1,
        });

        newDevice.on("registered", () => {
          if (!mounted) return;
          setCallStatus("ready");
        });

        newDevice.on("error", (error: { message: string }) => {
          if (!mounted) return;
          console.error("Device error:", error.message);
          setCallStatus("error");
        });

        newDevice.on("incoming", (call: Call) => {
          if (!mounted) return;
          const from = call.parameters.From ?? "Unknown";
          console.log(`Incoming call from ${from}`);
          
          // Play sound when incoming call arrives
          playIncomingCallSound();
          
          setCallStatus("incoming");
          setCurrentCall(call);

          // Notify parent component
          onIncomingCall?.(call, from);

          call.on("accept", () => {
            if (!mounted) return;
            console.log("Call accepted");
            setCallStatus("connected");
            onCallAccepted?.(call);
          });

          call.on("disconnect", () => {
            if (!mounted) return;
            console.log("Call disconnected");
            setCallStatus("ready");
            setCurrentCall(null);
            onCallDisconnected?.();
          });

          call.on("cancel", () => {
            if (!mounted) return;
            console.log("Call canceled");
            setCallStatus("ready");
            setCurrentCall(null);
            onCallDisconnected?.();
          });
        });

        await newDevice.register();
        
        if (mounted) {
          activeDevice = newDevice;
          deviceRef.current = newDevice;
        } else {
          newDevice.destroy();
        }

      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error initializing device: ${message}`);
        setCallStatus("error");
      }
    };

    void initDevice();

    // Cleanup
    return () => {
      mounted = false;
      if (activeDevice) {
        // Don't destroy device if there's an active call - let it continue
        const hasActiveCall = activeDevice.calls.length > 0;
        if (!hasActiveCall) {
          console.log("Cleaning up device (no active calls)...");
          activeDevice.destroy();
          deviceRef.current = null;
        } else {
          console.log("Keeping device alive (active call in progress)...");
          // Keep deviceRef.current set so Device persists
        }
      }
    };
  }, [dispatcherId, onIncomingCall, onCallAccepted, onCallDisconnected, playIncomingCallSound]);

  const acceptCall = useCallback(() => {
    if (currentCall) {
      console.log("Accepting call...");
      currentCall.accept();
      setCallStatus("connected");
    }
  }, [currentCall]);

  const rejectCall = useCallback(() => {
    if (currentCall) {
      console.log("Rejecting call...");
      currentCall.reject();
      setCallStatus("ready");
      setCurrentCall(null);
    }
  }, [currentCall]);

  const disconnectCall = useCallback(() => {
    if (currentCall) {
      console.log("Disconnecting call...");
      currentCall.disconnect();
      setCallStatus("ready");
      setCurrentCall(null);
    }
  }, [currentCall]);

  return {
    callStatus,
    currentCall,
    identity,
    acceptCall,
    rejectCall,
    disconnectCall,
    device: deviceRef.current,
  };
}

