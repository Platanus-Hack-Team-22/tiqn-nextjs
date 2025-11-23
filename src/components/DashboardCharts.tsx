import { useEffect, useState, useRef } from "react";

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ActivityWave />
      <ResourceRadar />
      <SystemStatus />
    </div>
  );
}

function ActivityWave() {
  const [data, setData] = useState<number[]>(Array(40).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const next = [...prev.slice(1), Math.random() * 100];
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Create SVG path
  const width = 100;
  const height = 50;
  const step = width / (data.length - 1);
  
  const pathD = `M 0 ${height} ` + data.map((val, i) => {
    const x = i * step;
    // Scale value to height (0-100 -> 50-0)
    const y = height - (val / 100) * height;
    return `L ${x} ${y}`;
  }).join(" ") + ` L ${width} ${height} Z`;

  return (
    <div className="glass-card flex flex-col rounded-lg p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-500/70">
          Net_Traffic
        </span>
        <span className="font-mono text-[10px] text-cyan-400">
          {Math.round(data[data.length - 1])} MB/s
        </span>
      </div>
      <div className="relative h-24 w-full overflow-hidden rounded bg-slate-900/50 border border-cyan-500/10">
        <svg className="h-full w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
           <defs>
            <linearGradient id="waveGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.5)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
            </linearGradient>
          </defs>
          <path d={pathD} fill="url(#waveGradient)" stroke="rgba(6, 182, 212, 0.8)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
      </div>
    </div>
  );
}

function ResourceRadar() {
  // Simulating dynamic resource allocation
  const [stats, setStats] = useState({ ems: 65, police: 40, fire: 20 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ems: Math.min(100, Math.max(30, prev.ems + (Math.random() - 0.5) * 10)),
        police: Math.min(100, Math.max(20, prev.police + (Math.random() - 0.5) * 15)),
        fire: Math.min(100, Math.max(10, prev.fire + (Math.random() - 0.5) * 5)),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate hexagon points (center 50,50, radius 40)
  const center = 50;
  const radius = 40;
  
  // 3 axes: Top (Fire), Bottom Right (Police), Bottom Left (EMS)
  // Angles: -90 (Top), 30 (BR), 150 (BL)
  const getPoint = (angle: number, value: number) => {
    const rad = (angle * Math.PI) / 180;
    const r = (value / 100) * radius;
    return `${center + r * Math.cos(rad)},${center + r * Math.sin(rad)}`;
  };

  const firePoint = getPoint(-90, stats.fire);
  const policePoint = getPoint(30, stats.police);
  const emsPoint = getPoint(150, stats.ems);

  return (
    <div className="glass-card flex flex-col rounded-lg p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-500/70">
          Unit_Deploy
        </span>
      </div>
      <div className="relative flex h-24 items-center justify-center">
        <svg className="h-full w-full" viewBox="0 0 100 100">
          {/* Background Grid (Hexagon) */}
          <polygon points="50,10 84.6,30 84.6,70 50,90 15.4,70 15.4,30" fill="none" stroke="rgba(6,182,212,0.1)" strokeWidth="1" />
          <polygon points="50,30 67.3,40 67.3,60 50,70 32.7,60 32.7,40" fill="none" stroke="rgba(6,182,212,0.1)" strokeWidth="1" />
          
          {/* Axes */}
          <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(6,182,212,0.1)" strokeWidth="1" />
          <line x1="50" y1="50" x2="84.6" y2="70" stroke="rgba(6,182,212,0.1)" strokeWidth="1" />
          <line x1="50" y1="50" x2="15.4" y2="70" stroke="rgba(6,182,212,0.1)" strokeWidth="1" />

          {/* Data Shape */}
          <polygon points={`${firePoint} ${policePoint} ${emsPoint}`} fill="rgba(6,182,212,0.3)" stroke="rgba(6,182,212,0.8)" strokeWidth="1.5">
             <animate attributeName="points" duration="1s" />
          </polygon>

          {/* Labels */}
          <text x="50" y="8" textAnchor="middle" className="fill-red-400 text-[6px] font-mono">FIRE</text>
          <text x="90" y="75" textAnchor="middle" className="fill-blue-400 text-[6px] font-mono">POLICE</text>
          <text x="10" y="75" textAnchor="middle" className="fill-emerald-400 text-[6px] font-mono">EMS</text>
        </svg>
      </div>
    </div>
  );
}

function SystemStatus() {
  const [cpu, setCpu] = useState(45);
  const [memory, setMemory] = useState(62);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 20)));
      setMemory(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 5)));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card flex flex-col rounded-lg p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-500/70">
          Sys_Integrity
        </span>
        <div className="flex gap-1">
          <div className={`h-1.5 w-1.5 rounded-full ${cpu > 80 ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
        </div>
      </div>
      <div className="grid h-24 grid-cols-2 gap-2">
         <CircularGauge label="AI_CORE" value={cpu} color={cpu > 80 ? "text-red-400" : "text-cyan-400"} stroke={cpu > 80 ? "stroke-red-500" : "stroke-cyan-500"} />
         <CircularGauge label="DB_IO" value={memory} color="text-purple-400" stroke="stroke-purple-500" />
      </div>
    </div>
  );
}

function CircularGauge({ label, value, color, stroke }: { label: string, value: number, color: string, stroke: string }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
       <div className="relative h-12 w-12">
         <svg className="h-full w-full -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
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
            <span className={`font-mono text-[10px] ${color}`}>{Math.round(value)}%</span>
         </div>
       </div>
       <span className="mt-1 font-mono text-[8px] text-gray-500">{label}</span>
    </div>
  );
}

