import React, { useState, useEffect } from 'react';
import { AlertCircle, PhoneCall, ChevronRight, X, ShieldAlert } from 'lucide-react';
import { emergencyService } from '../services/emergencyService';

export const EmergencyBanner = ({ onOpenEmergencyPage }) => {
  const [criticalIncidents, setCriticalIncidents] = useState([]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = emergencyService.subscribeToEmergencies((reports) => {
      const activeCritical = reports.filter(
        (r) => (r.severity === 'critical' || r.immediateDanger) && ['reported', 'verified', 'assigned', 'in_progress'].includes(r.status)
      );
      setCriticalIncidents(activeCritical);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (isDismissed || criticalIncidents.length === 0) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 text-xs text-amber-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold text-amber-900 shrink-0 hidden sm:inline">Notice:</span>
            <span className="text-amber-800 truncate">
              CloudMesh is a community aid platform — not a 911 replacement. For life-threatening emergencies, call{' '}
              <strong>911</strong> or <strong>112</strong>.
            </span>
          </div>
          <a
            href="tel:911"
            className="shrink-0 inline-flex items-center gap-1 font-bold text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors"
          >
            <PhoneCall className="w-3 h-3" />
            <span>911</span>
          </a>
        </div>
      </div>
    );
  }

  const latest = criticalIncidents[0];

  return (
    <div className="bg-gradient-to-r from-rose-800 via-rose-700 to-amber-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 shadow-sm border-b border-rose-900/60 animate-in fade-in">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
          </span>
          <span className="font-extrabold uppercase tracking-wider bg-rose-950/80 px-2 py-0.5 rounded-md text-[11px] sm:text-xs border border-rose-400/30 shrink-0">
            Active Hazard ({criticalIncidents.length})
          </span>
          <span className="font-semibold truncate text-white text-xs sm:text-sm">
            {latest.title} <span className="text-rose-200 font-normal hidden md:inline">— {latest.location}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto ml-auto">
          <button
            onClick={onOpenEmergencyPage}
            className="bg-white text-rose-800 hover:bg-rose-50 font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 transition-all shadow-xs"
          >
            <span>Triage Feed</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <a
            href="tel:911"
            className="bg-rose-950 hover:bg-black text-white font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 border border-rose-500/40 transition-colors shadow-xs"
          >
            <PhoneCall className="w-3 h-3 text-rose-300" />
            <span>Call 911</span>
          </a>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-rose-200 hover:text-white p-1 rounded-lg hover:bg-rose-700/60 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
