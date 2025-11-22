"use client";

import Link from "next/link";
import type { Id } from "../../../convex/_generated/dataModel";

type IncidentCardProps = {
  incidentId: Id<"incidents">;
  incidentNumber: string;
  incidentType: string | undefined;
  location: string;
  phone?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: string;
  elapsedTime?: string;
  onClick?: () => void;
};

export function IncidentCard({
  incidentId,
  incidentNumber,
  incidentType,
  location,
  phone,
  priority,
  status,
  elapsedTime,
  onClick,
}: IncidentCardProps) {
  const isCritical = priority === "critical";
  const isActive = status === "confirmed" || status === "incoming_call";

  return (
    <Link
      href={`/dispatcher/${incidentId}`}
      onClick={onClick}
      className={`bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden shadow-sm ${
        isCritical ? "border-red-500/40 hover:border-red-500" : "border-slate-200"
      } ${!isActive ? "opacity-60" : ""}`}
    >
      {isCritical && <div className="absolute top-0 right-0 w-1 h-full bg-red-500"></div>}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`${
              isCritical
                ? "bg-red-50 text-red-600 border-red-200 pulse-critical"
                : "bg-slate-100 text-slate-600 border-slate-300"
            } text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border`}
          >
            {isCritical ? "Critical" : status === "in_progress" ? "Active" : status}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{incidentNumber}</span>
        </div>
        {elapsedTime && (
          <span className={`font-mono text-sm font-semibold ${isCritical ? "text-red-600" : "text-slate-600"}`}>
            {elapsedTime}
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-2 leading-tight">
        {incidentType ?? "Unknown Incident"}
      </h3>
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="font-mono">{location}</span>
        </div>
        {phone && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span className="font-mono">{phone}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          {status === "confirmed" ? "Initiated" : status}
        </span>
        <span className="text-[10px] text-blue-600 font-mono">→ Open</span>
      </div>
    </Link>
  );
}

