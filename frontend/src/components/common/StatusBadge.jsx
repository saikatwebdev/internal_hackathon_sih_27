import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const s = status.toUpperCase();

  let colors = "bg-slate-800 text-slate-300 border-slate-700";

  if (s.includes("PRESENT")) {
    colors = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  } else if (s.includes("ABSENT") || s.includes("REJECTED")) {
    colors = "bg-rose-500/10 text-rose-400 border-rose-500/30";
  } else if (s.includes("LATE")) {
    colors = "bg-amber-500/10 text-amber-400 border-amber-500/30";
  } else if (s.includes("MISSING") || s.includes("PENDING")) {
    colors = "bg-orange-500/10 text-orange-400 border-orange-500/30";
  } else if (s.includes("INSUFFICIENT")) {
    colors = "bg-purple-500/10 text-purple-400 border-purple-500/30";
  } else if (s.includes("ACTIVE") || s.includes("SCHEDULED")) {
    colors = "bg-blue-500/10 text-blue-400 border-blue-500/30";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {s.replace("_", " ")}
    </span>
  );
};

export default StatusBadge;
