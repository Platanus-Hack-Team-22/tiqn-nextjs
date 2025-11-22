"use client";

type PriorityBadgeProps = {
  priority: "low" | "medium" | "high" | "critical";
  className?: string;
};

export function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  const styles = {
    critical: "bg-red-50 text-red-600 border-red-200",
    high: "bg-orange-50 text-orange-600 border-orange-200",
    medium: "bg-yellow-50 text-yellow-600 border-yellow-200",
    low: "bg-slate-100 text-slate-600 border-slate-300",
  };

  return (
    <span
      className={`${styles[priority]} text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${className}`}
    >
      {priority}
    </span>
  );
}

