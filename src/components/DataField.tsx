import { useEffect, useState, useRef } from "react";

interface DataFieldProps {
  label: string;
  value: string | number | null | undefined;
  isLoading?: boolean;
  isCritical?: boolean;
  className?: string;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

export function DataField({
  label,
  value,
  isLoading = false,
  isCritical = false,
  className = "",
}: DataFieldProps) {
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isDecoding, setIsDecoding] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  
  // Keep track of the previous value to detect changes
  const prevValueRef = useRef<string | number | null | undefined>(value);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Handle initialization
    if (!hasInitialized.current) {
      if (value) {
        setDisplayValue(String(value));
      } else {
        setDisplayValue("");
      }
      hasInitialized.current = true;
      return;
    }

    // If we're loading, clear or keep placeholder
    if (isLoading) {
      setDisplayValue("");
      return;
    }

    // If value changed and is truthy, trigger effects
    if (value && value !== prevValueRef.current) {
      const finalValue = String(value);
      setIsDecoding(true);
      
      if (isCritical) {
        setShowBurst(true);
        setTimeout(() => setShowBurst(false), 1000);
      }

      let iteration = 0;
      const maxIterations = 10; // How many times to scramble per character
      let interval: NodeJS.Timeout;

      interval = setInterval(() => {
        setDisplayValue((prev) => {
          return finalValue
            .split("")
            .map((char, index) => {
              if (index < iteration) {
                return finalValue[index];
              }
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join("");
        });

        if (iteration >= finalValue.length) {
          clearInterval(interval);
          setIsDecoding(false);
          setDisplayValue(finalValue); // Ensure final value is exact
        }

        iteration += 1 / 2; // Speed of decoding
      }, 30);

      return () => clearInterval(interval);
    } else if (!value) {
      setDisplayValue("");
    }
    
    prevValueRef.current = value;
  }, [value, isLoading, isCritical]);

  return (
    <div className={`relative ${className}`}>
      <div className="mb-1 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-500/60">
          {label}
        </span>
        {isDecoding && (
          <div className="h-1 w-1 animate-pulse rounded-full bg-cyan-400" />
        )}
      </div>
      
      <div className="relative min-h-[1.5em] overflow-hidden rounded border border-cyan-900/30 bg-slate-900/50 px-3 py-2 backdrop-blur-sm">
        {/* Loading State - Scanner */}
        {isLoading && (
          <div className="absolute inset-0 animate-scan opacity-50">
             <div className="h-full w-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
          </div>
        )}

        {/* Particle Burst for Critical Fields */}
        {showBurst && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-full w-full animate-[particle-burst_0.6s_ease-out_forwards] rounded-full bg-cyan-400/20" />
            <div className="absolute h-px w-full animate-[particle-burst_0.6s_ease-out_forwards] bg-cyan-400/50" />
            <div className="absolute h-full w-px animate-[particle-burst_0.6s_ease-out_forwards] bg-cyan-400/50" />
          </div>
        )}

        {/* Content */}
        <div className={`font-mono text-sm ${
          isDecoding ? "text-cyan-400" : "text-gray-100"
        } ${!value && !isLoading ? "text-gray-700 italic" : ""}`}>
          {isLoading ? (
            <span className="opacity-0">Loading...</span>
          ) : displayValue ? (
            displayValue
          ) : (
            <span className="select-none text-slate-700">---</span>
          )}
          {/* Blinking Cursor during decode */}
          {isDecoding && (
            <span className="animate-pulse text-cyan-400">_</span>
          )}
        </div>
        
        {/* Corner Accents for "Tech" feel */}
        <div className="absolute left-0 top-0 h-2 w-2 border-l border-t border-cyan-500/20" />
        <div className="absolute right-0 bottom-0 h-2 w-2 border-r border-b border-cyan-500/20" />
      </div>
    </div>
  );
}

