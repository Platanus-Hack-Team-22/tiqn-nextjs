"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { TIMED_DEMO_FERNANDO, type TimedDemoScript } from "../lib/demoScripts";

interface DemoControllerProps {
  isOpen: boolean;
  onToggle: () => void;
  onTriggerIncomingCall: () => void;
  onAcceptCall: () => void;
  callStatus: string;
  activeIncidentId: Id<"incidents"> | null;
  dispatcherId: string;
}

type DemoPhase = "idle" | "incoming" | "connected" | "autoplay" | "complete";

export function DemoController({
  isOpen,
  onToggle,
  onTriggerIncomingCall,
  onAcceptCall,
  callStatus,
  activeIncidentId,
  dispatcherId,
}: DemoControllerProps) {
  const [demoPhase, setDemoPhase] = useState<DemoPhase>("idle");
  const [timedScript] = useState<TimedDemoScript>(TIMED_DEMO_FERNANDO);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentExtractionIndex, setCurrentExtractionIndex] = useState(0);
  
  // Refs for cleanup and state tracking
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const fullTranscriptRef = useRef<string>(""); // Track transcript across async calls
  const isStoppedRef = useRef<boolean>(false); // Track if autoplay was stopped
  const autoplayTriggeredRef = useRef<boolean>(false); // Track if autoplay was already triggered for current call

  // Convex mutations
  const createDemoIncident = useMutation(api.incidents.createDemoIncident);
  const updateDemoField = useMutation(api.incidents.updateDemoField);
  const setActiveIncident = useMutation(api.app_state.setActiveIncident);

  // Cleanup function
  const cleanup = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset when callStatus changes
  useEffect(() => {
    if (callStatus === "incoming") {
      setDemoPhase("incoming");
      autoplayTriggeredRef.current = false; // Reset for new call
    } else if (callStatus === "connected") {
      setDemoPhase("connected");
    } else if (callStatus === "ready") {
      cleanup();
      isStoppedRef.current = true;
      fullTranscriptRef.current = "";
      autoplayTriggeredRef.current = false; // Reset
      setDemoPhase("idle");
      setIsAutoPlaying(false);
      setElapsedTime(0);
      setCurrentSegmentIndex(0);
      setCurrentExtractionIndex(0);
    }
  }, [callStatus, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Handle triggering incoming call
  const handleTriggerCall = useCallback(async () => {
    if (!dispatcherId) {
      console.error("No dispatcher selected");
      return;
    }

    try {
      const incidentId = await createDemoIncident({
        dispatcherId,
        callSessionId: `demo-${Date.now()}`,
      });

      await setActiveIncident({ incidentId });
      onTriggerIncomingCall();
      setDemoPhase("incoming");
    } catch (error) {
      console.error("Error creating demo incident:", error);
    }
  }, [dispatcherId, createDemoIncident, setActiveIncident, onTriggerIncomingCall]);

  // Generate pre-calculated random delays that sum to target duration
  const generateRandomDelays = useCallback((wordCount: number, totalDurationMs: number): number[] => {
    if (wordCount <= 1) return [];
    
    const delayCount = wordCount - 1;
    const delays: number[] = [];
    
    // Generate random weights with variation
    for (let i = 0; i < delayCount; i++) {
      // Random weight between 0.3 and 2.5, with 10% chance of a pause (3.0 to 5.0)
      const isPause = Math.random() < 0.1;
      const weight = isPause 
        ? 3.0 + Math.random() * 2.0  // Pause: 3x to 5x
        : 0.3 + Math.random() * 2.2; // Normal: 0.3x to 2.5x
      delays.push(weight);
    }
    
    // Normalize to sum to totalDurationMs
    const totalWeight = delays.reduce((a, b) => a + b, 0);
    const normalizedDelays = delays.map(w => Math.floor((w / totalWeight) * totalDurationMs));
    
    // Adjust for rounding errors
    const actualTotal = normalizedDelays.reduce((a, b) => a + b, 0);
    const diff = totalDurationMs - actualTotal;
    const lastIndex = normalizedDelays.length - 1;
    if (lastIndex >= 0 && normalizedDelays[lastIndex] !== undefined) {
      normalizedDelays[lastIndex] = normalizedDelays[lastIndex] + diff;
    }
    
    return normalizedDelays;
  }, []);

  // Send transcript with word-by-word animation and natural timing
  const sendTranscriptWordByWord = useCallback(async (
    incidentId: Id<"incidents">,
    text: string,
    durationMs: number,
    isNewSegment = false
  ) => {
    const words = text.split(" ");
    
    // Pre-calculate all delays to fit exactly in durationMs
    const delays = generateRandomDelays(words.length, durationMs);
    
    for (let i = 0; i < words.length; i++) {
      // Check if stopped
      if (isStoppedRef.current) return;
      
      // Add word to accumulated transcript
      // Use double newline between segments for card separation
      let separator = "";
      if (fullTranscriptRef.current) {
        separator = (i === 0 && isNewSegment) ? "\n\n" : " ";
      }
      fullTranscriptRef.current = fullTranscriptRef.current + separator + words[i];
      
      try {
        await updateDemoField({
          incidentId,
          field: "liveTranscript",
          value: fullTranscriptRef.current,
        });
      } catch (error) {
        console.error("Error updating transcript:", error);
      }
      
      // Use pre-calculated delay
      if (i < delays.length) {
        await new Promise(resolve => setTimeout(resolve, delays[i]));
      }
    }
  }, [updateDemoField, generateRandomDelays]);

  // Start the fully automated demo
  const handleStartAutoPlay = useCallback(async () => {
    if (!activeIncidentId) return;
    
    // Reset state
    fullTranscriptRef.current = "";
    isStoppedRef.current = false;
    
    setIsAutoPlaying(true);
    setDemoPhase("autoplay");
    startTimeRef.current = Date.now();
    
    // Start elapsed time counter
    intervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 100);
    
    // Create a merged timeline of all events (segments + extractions)
    type TimelineEvent = 
      | { type: "segment"; startMs: number; data: { text: string; durationMs: number }; index: number }
      | { type: "extraction"; startMs: number; data: { field: string; value: string | number }; index: number };
    
    const timeline: TimelineEvent[] = [
      ...timedScript.segments.map((seg, i) => ({
        type: "segment" as const,
        startMs: seg.startMs,
        data: { text: seg.text, durationMs: seg.durationMs },
        index: i,
      })),
      ...timedScript.extractions.map((ext, i) => ({
        type: "extraction" as const,
        startMs: ext.startMs,
        data: { field: ext.field, value: ext.value },
        index: i,
      })),
    ].sort((a, b) => a.startMs - b.startMs);
    
    // Run all events sequentially based on their timing
    const runTimeline = async () => {
      let lastEventTime = 0;
      
      for (const event of timeline) {
        if (isStoppedRef.current) return;
        
        // Wait until this event's time
        const waitTime = event.startMs - lastEventTime;
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        lastEventTime = event.startMs;
        
        if (isStoppedRef.current) return;
        
        if (event.type === "segment") {
          setCurrentSegmentIndex(event.index + 1);
          // This will append to fullTranscriptRef.current
          // Pass isNewSegment=true for segments after the first one
          await sendTranscriptWordByWord(
            activeIncidentId,
            event.data.text,
            event.data.durationMs,
            event.index > 0 // isNewSegment - true for all except first segment
          );
          // Update lastEventTime to account for segment duration
          lastEventTime = event.startMs + event.data.durationMs;
        } else if (event.type === "extraction") {
          setCurrentExtractionIndex(event.index + 1);
          try {
            await updateDemoField({
              incidentId: activeIncidentId,
              field: event.data.field,
              value: event.data.value,
            });
          } catch (error) {
            console.error("Error extracting field:", error);
          }
        }
      }
      
      // Complete
      if (!isStoppedRef.current) {
        // Small delay after last event
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsAutoPlaying(false);
        setDemoPhase("complete");
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    };
    
    void runTimeline();
    
  }, [activeIncidentId, timedScript, sendTranscriptWordByWord, updateDemoField]);

  // Handle accepting the call
  const handleAcceptCall = useCallback(() => {
    onAcceptCall();
    setDemoPhase("connected");
  }, [onAcceptCall]);

  // Auto-start autoplay when connected with an active incident
  // This works for both: clicking Accept in demo panel OR clicking Accept in main UI
  useEffect(() => {
    if (
      callStatus === "connected" &&
      activeIncidentId &&
      !isAutoPlaying &&
      !autoplayTriggeredRef.current &&
      demoPhase === "connected"
    ) {
      autoplayTriggeredRef.current = true;
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        void handleStartAutoPlay();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [callStatus, activeIncidentId, isAutoPlaying, demoPhase, handleStartAutoPlay]);

  // Stop autoplay
  const handleStopAutoPlay = useCallback(() => {
    isStoppedRef.current = true;
    cleanup();
    setIsAutoPlaying(false);
    setDemoPhase("connected");
  }, [cleanup]);

  // Format time as MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Keyboard shortcut for toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        onToggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggle]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[#1A1A1A]/20 bg-[#FFFAF1] shadow-lg transition hover:bg-[#E6DAC7] hover:shadow-xl"
        title="Toggle Demo Mode (Ctrl+Shift+D)"
      >
        <span className="text-lg">🎬</span>
      </button>
    );
  }

  const phaseColors: Record<DemoPhase, string> = {
    idle: "bg-[#E6DAC7]",
    incoming: "bg-amber-200",
    connected: "bg-green-200",
    autoplay: "bg-red-200",
    complete: "bg-emerald-200",
  };

  return (
    <div className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-[#E6DAC7] bg-[#FFFAF1]/95 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E6DAC7] p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎬</span>
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[#1A1A1A]">
            Demo Mode
          </h2>
        </div>
        <button
          onClick={onToggle}
          className="rounded p-1 text-[#1A1A1A]/70 hover:bg-[#E6DAC7] hover:text-[#1A1A1A]"
        >
          ✕
        </button>
      </div>

      {/* Phase Indicator */}
      <div className="border-b border-[#E6DAC7] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${phaseColors[demoPhase]} ${isAutoPlaying ? "animate-pulse" : ""}`} />
            <span className="font-mono text-xs uppercase tracking-wider text-[#1A1A1A]/80">
              {demoPhase}
            </span>
          </div>
          {isAutoPlaying && (
            <span className="font-mono text-sm font-bold text-red-600">
              {formatTime(elapsedTime)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Phase 1: Idle */}
        {demoPhase === "idle" && (
          <div className="space-y-4">
            <div className="rounded border border-[#E6DAC7] bg-[#FFFAF1] p-3">
              <h3 className="mb-2 font-mono text-xs font-bold uppercase text-[#1A1A1A]">
                {timedScript.name}
              </h3>
              <p className="mb-3 text-xs text-[#1A1A1A]/70">
                {timedScript.description}
              </p>
              <div className="mb-3 rounded bg-blue-50 p-2 text-[10px] text-blue-700">
                <div>📝 {timedScript.segments.length} segmentos de texto</div>
                <div>🧠 {timedScript.extractions.length} campos a extraer</div>
                <div>⏱️ ~{Math.ceil((timedScript.extractions[timedScript.extractions.length - 1]?.startMs ?? 0) / 1000)}s duración</div>
              </div>
              <button
                onClick={handleTriggerCall}
                disabled={!dispatcherId}
                className="w-full rounded border border-amber-600/40 bg-amber-50 px-4 py-2 font-mono text-xs uppercase tracking-wide text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                📞 Iniciar Demo
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Incoming */}
        {demoPhase === "incoming" && (
          <div className="space-y-4">
            <div className="rounded border border-amber-300 bg-amber-50 p-3">
              <h3 className="mb-2 font-mono text-xs font-bold uppercase text-amber-800">
                Llamada Entrante
              </h3>
              <p className="mb-3 text-xs text-amber-700">
                Click en Accept Call en la UI principal
              </p>
              <button
                onClick={handleAcceptCall}
                className="w-full rounded border border-green-600/40 bg-green-50 px-4 py-2 font-mono text-xs uppercase tracking-wide text-green-700 transition hover:bg-green-100"
              >
                ✓ Accept Call
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: Connected - Ready to start auto */}
        {demoPhase === "connected" && (
          <div className="space-y-4">
            <div className="rounded border border-green-300 bg-green-50 p-3">
              <h3 className="mb-2 font-mono text-xs font-bold uppercase text-green-800">
                ✓ Llamada Conectada
              </h3>
              <p className="mb-3 text-xs text-green-700">
                Presiona el botón para iniciar la secuencia automática.
                El texto aparecerá palabra por palabra y los campos se extraerán automáticamente.
              </p>
              <button
                onClick={handleStartAutoPlay}
                className="w-full rounded border border-red-600/40 bg-red-50 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wide text-red-700 transition hover:bg-red-100"
              >
                ▶️ INICIAR AUTO-PLAY
              </button>
            </div>
            
            {/* Preview */}
            <div className="rounded border border-[#E6DAC7] bg-[#FFFAF1] p-3">
              <h3 className="mb-2 font-mono text-xs font-bold uppercase text-[#1A1A1A]">
                Timeline
              </h3>
              <div className="space-y-1 text-[10px]">
                {timedScript.segments.map((seg, i) => (
                  <div key={i} className="flex gap-2 text-[#1A1A1A]/70">
                    <span className="font-mono text-blue-600">{formatTime(seg.startMs)}</span>
                    <span className="truncate">{seg.text.substring(0, 30)}...</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Phase 4: Autoplay in progress */}
        {demoPhase === "autoplay" && (
          <div className="space-y-4">
            <div className="rounded border border-red-300 bg-red-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold uppercase text-red-800">
                  🔴 Auto-Play Activo
                </h3>
                <span className="font-mono text-lg font-bold text-red-600">
                  {formatTime(elapsedTime)}
                </span>
              </div>
              
              {/* Progress bars */}
              <div className="mb-3 space-y-2">
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-red-600">
                    <span>Transcripción</span>
                    <span>{currentSegmentIndex}/{timedScript.segments.length}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-red-200">
                    <div
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${(currentSegmentIndex / timedScript.segments.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-purple-600">
                    <span>Extracción</span>
                    <span>{currentExtractionIndex}/{timedScript.extractions.length}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-purple-200">
                    <div
                      className="h-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${(currentExtractionIndex / timedScript.extractions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleStopAutoPlay}
                className="w-full rounded border border-gray-600/40 bg-gray-100 px-4 py-2 font-mono text-xs uppercase tracking-wide text-gray-700 transition hover:bg-gray-200"
              >
                ⏹️ Detener
              </button>
            </div>
            
            {/* Current segment info */}
            {currentSegmentIndex > 0 && currentSegmentIndex <= timedScript.segments.length && (
              <div className="rounded border border-blue-300 bg-blue-50 p-2">
                <div className="text-[10px] text-blue-600">Último segmento:</div>
                <div className="text-xs text-blue-900">
                  {timedScript.segments[currentSegmentIndex - 1]?.text.substring(0, 80)}...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase 5: Complete */}
        {demoPhase === "complete" && (
          <div className="space-y-4">
            <div className="rounded border border-emerald-300 bg-emerald-50 p-3">
              <h3 className="mb-2 font-mono text-xs font-bold uppercase text-emerald-800">
                ✓ Demo Completo
              </h3>
              <p className="text-xs text-emerald-700">
                Secuencia finalizada en {formatTime(elapsedTime)}.
                Ahora puedes aprobar la emergencia en la UI.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#E6DAC7] p-3">
        <div className="text-center font-mono text-[10px] text-[#1A1A1A]/50">
          Ctrl+Shift+D para toggle
        </div>
      </div>
    </div>
  );
}
