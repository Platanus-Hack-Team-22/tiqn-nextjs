import { useEffect, useState } from "react";

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ResponseTimeChart />
      <VitalSignsMonitor />
      <PatientStatus />
    </div>
  );
}

function ResponseTimeChart() {
  // Mock response times in minutes (realistic range: 3-15 minutes)
  // Use fixed initial values to prevent hydration mismatch
  const [responseTimes, setResponseTimes] = useState<number[]>(() => 
    Array(30).fill(8) as number[] // Fixed initial value
  );

  // Initialize with random values only on client side after mount
  useEffect(() => {
    setResponseTimes(Array(30).fill(0).map(() => 5 + Math.random() * 8)); // Initial values between 5-13 min
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setResponseTimes((prev) => {
        // Simulate realistic response time variations
        const newTime = Math.max(3, Math.min(15, prev[prev.length - 1]! + (Math.random() - 0.5) * 2));
        return [...prev.slice(1), newTime];
      });
    }, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  // Create SVG path
  const width = 100;
  const height = 50;
  const step = width / (responseTimes.length - 1);
  const maxTime = 15; // Maximum response time in minutes
  
  const pathD = `M 0 ${height} ` + responseTimes.map((time, i) => {
    const x = i * step;
    // Scale time to height (0-15 min -> height-0)
    const y = height - (time / maxTime) * height;
    return `L ${x} ${y}`;
  }).join(" ") + ` L ${width} ${height} Z`;

  const lastTime = responseTimes[responseTimes.length - 1] ?? 0;
  const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  return (
    <div className="glass-card flex flex-col rounded-lg p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/80">
          Response_Time
        </span>
        <span className="font-mono text-[10px] text-[#1A1A1A]" suppressHydrationWarning>
          {lastTime.toFixed(1)} min
        </span>
      </div>
      <div className="relative h-24 w-full overflow-hidden rounded bg-[#FFFAF1] border border-[#E6DAC7]">
        <svg className="h-full w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="responseGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(220, 38, 38, 0.3)" />
              <stop offset="50%" stopColor="rgba(217, 119, 6, 0.2)" />
              <stop offset="100%" stopColor="rgba(60, 64, 67, 0)" />
            </linearGradient>
          </defs>
          {/* Target line at 8 minutes (good response time) */}
          <line x1="0" y1={height - (8 / maxTime) * height} x2={width} y2={height - (8 / maxTime) * height} 
                stroke="rgba(26, 26, 26, 0.2)" strokeWidth="0.5" strokeDasharray="2,2" />
          <path d={pathD} fill="url(#responseGradient)" stroke="rgba(220, 38, 38, 0.6)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute bottom-1 right-1">
          <span className="font-mono text-[8px] text-[#1A1A1A]/60" suppressHydrationWarning>Avg: {avgTime.toFixed(1)}m</span>
        </div>
      </div>
    </div>
  );
}

function VitalSignsMonitor() {
  // Mock vital signs: Heart Rate (60-100 bpm), Blood Pressure (systolic 90-140), O2 Sat (95-100%)
  // Use fixed initial values to prevent hydration mismatch
  const [vitals, setVitals] = useState({
    heartRate: 75,
    bloodPressure: 120,
    oxygenSat: 98,
  });

  // Initialize with random values only on client side after mount
  useEffect(() => {
    setVitals({
      heartRate: 72 + Math.random() * 20, // 72-92 bpm
      bloodPressure: 110 + Math.random() * 20, // 110-130 mmHg
      oxygenSat: 97 + Math.random() * 2.5, // 97-99.5%
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(prev => ({
        heartRate: Math.max(60, Math.min(100, prev.heartRate + (Math.random() - 0.5) * 4)),
        bloodPressure: Math.max(90, Math.min(140, prev.bloodPressure + (Math.random() - 0.5) * 5)),
        oxygenSat: Math.max(95, Math.min(100, prev.oxygenSat + (Math.random() - 0.5) * 1)),
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Calculate hexagon points (center 50,50, radius 40)
  const center = 50;
  const radius = 40;
  
  // 3 axes: Top (Heart Rate), Bottom Right (Blood Pressure), Bottom Left (O2 Sat)
  // Normalize values to 0-100 scale
  const normalizeHR = ((vitals.heartRate - 60) / 40) * 100; // 60-100 bpm -> 0-100%
  const normalizeBP = ((vitals.bloodPressure - 90) / 50) * 100; // 90-140 mmHg -> 0-100%
  const normalizeO2 = ((vitals.oxygenSat - 95) / 5) * 100; // 95-100% -> 0-100%
  
  // Angles: -90 (Top), 30 (BR), 150 (BL)
  const getPoint = (angle: number, value: number) => {
    const rad = (angle * Math.PI) / 180;
    const r = Math.min(100, Math.max(0, value)) / 100 * radius;
    return `${center + r * Math.cos(rad)},${center + r * Math.sin(rad)}`;
  };

  const hrPoint = getPoint(-90, normalizeHR);
  const bpPoint = getPoint(30, normalizeBP);
  const o2Point = getPoint(150, normalizeO2);

  return (
    <div className="glass-card flex flex-col rounded-lg p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/80">
          Vital_Signs
        </span>
        <div className="flex items-center gap-1">
          <div className={`h-1.5 w-1.5 rounded-full ${
            vitals.oxygenSat < 96 ? "bg-red-600 animate-pulse" : 
            vitals.heartRate > 90 || vitals.heartRate < 65 ? "bg-amber-600" : "bg-green-600"
          }`} />
        </div>
      </div>
      <div className="relative flex h-24 items-center justify-center">
        <svg className="h-full w-full" viewBox="0 0 100 100">
          {/* Background Grid (Hexagon) */}
          <polygon points="50,10 84.6,30 84.6,70 50,90 15.4,70 15.4,30" fill="none" stroke="rgba(26,26,26,0.15)" strokeWidth="1" />
          <polygon points="50,30 67.3,40 67.3,60 50,70 32.7,60 32.7,40" fill="none" stroke="rgba(26,26,26,0.15)" strokeWidth="1" />
          
          {/* Axes */}
          <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(26,26,26,0.15)" strokeWidth="1" />
          <line x1="50" y1="50" x2="84.6" y2="70" stroke="rgba(26,26,26,0.15)" strokeWidth="1" />
          <line x1="50" y1="50" x2="15.4" y2="70" stroke="rgba(26,26,26,0.15)" strokeWidth="1" />

          {/* Data Shape */}
          <polygon points={`${hrPoint} ${bpPoint} ${o2Point}`} fill="rgba(26,26,26,0.2)" stroke="rgba(26,26,26,0.6)" strokeWidth="1.5" className="transition-all duration-1000 ease-out" />

          {/* Labels */}
          <text x="50" y="8" textAnchor="middle" className="fill-red-700 text-[6px] font-mono">HR</text>
          <text x="90" y="75" textAnchor="middle" className="fill-blue-700 text-[6px] font-mono">BP</text>
          <text x="10" y="75" textAnchor="middle" className="fill-emerald-700 text-[6px] font-mono">O2</text>
        </svg>
      </div>
      <div className="mt-1 flex justify-between text-[8px] font-mono text-[#1A1A1A]/70">
        <span suppressHydrationWarning>HR: {Math.round(vitals.heartRate)}</span>
        <span suppressHydrationWarning>BP: {Math.round(vitals.bloodPressure)}</span>
        <span suppressHydrationWarning>O2: {vitals.oxygenSat.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function PatientStatus() {
  // Mock patient status: Critical (0-15%), Stable (60-80%), Observation (20-30%)
  // Use fixed initial values to prevent hydration mismatch
  const [status, setStatus] = useState({
    critical: 10,
    stable: 70,
    observation: 25,
  });

  // Initialize with random values only on client side after mount
  useEffect(() => {
    setStatus({
      critical: 8 + Math.random() * 5, // 8-13%
      stable: 65 + Math.random() * 15, // 65-80%
      observation: 22 + Math.random() * 8, // 22-30%
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(prev => ({
        critical: Math.max(0, Math.min(20, prev.critical + (Math.random() - 0.5) * 3)),
        stable: Math.max(50, Math.min(85, prev.stable + (Math.random() - 0.5) * 5)),
        observation: Math.max(15, Math.min(35, prev.observation + (Math.random() - 0.5) * 4)),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Normalize to ensure they add up to ~100% (for display purposes)
  const total = status.critical + status.stable + status.observation;
  const normalizedCritical = (status.critical / total) * 100;
  const normalizedStable = (status.stable / total) * 100;
  const normalizedObservation = (status.observation / total) * 100;

  return (
    <div className="glass-card flex flex-col rounded-lg p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/80">
          Patient_Status
        </span>
        <div className="flex gap-1">
          <div className={`h-1.5 w-1.5 rounded-full ${normalizedCritical > 12 ? "bg-red-600 animate-pulse" : "bg-green-600"}`} />
          <div className="h-1.5 w-1.5 rounded-full bg-[#1A1A1A]" />
        </div>
      </div>
      <div className="grid h-24 grid-cols-2 gap-2">
         <CircularGauge 
           label="CRITICAL" 
           value={normalizedCritical} 
           color={normalizedCritical > 12 ? "text-red-700" : "text-red-600"} 
           stroke={normalizedCritical > 12 ? "stroke-red-600" : "stroke-red-500"} 
         />
         <CircularGauge 
           label="STABLE" 
           value={normalizedStable} 
           color="text-green-700" 
           stroke="stroke-green-600" 
         />
      </div>
      <div className="mt-1 flex items-center justify-center">
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-amber-600" />
          <span className="font-mono text-[8px] text-[#1A1A1A]/70" suppressHydrationWarning>OBS: {normalizedObservation.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

function CircularGauge({
  label,
  value,
  color,
  stroke,
}: {
  label: string;
  value: number;
  color: string;
  stroke: string;
}) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
       <div className="relative h-12 w-12">
         <svg className="h-full w-full -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(26,26,26,0.15)" strokeWidth="3" />
            <circle 
              cx="20" cy="20" r={radius} 
              fill="none" 
              className={`${stroke} transition-all duration-500 ease-out`}
              strokeWidth="3" 
              strokeDasharray={circumference} 
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
         </svg>
         <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-mono text-[10px] ${color}`} suppressHydrationWarning>{Math.round(value)}%</span>
         </div>
       </div>
       <span className="mt-1 font-mono text-[8px] text-[#1A1A1A]/70">{label}</span>
    </div>
  );
}
