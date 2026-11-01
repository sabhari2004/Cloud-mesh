import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  MapPin,
  Clock,
  User,
  PlusCircle,
  Filter,
  CheckCircle2,
  LifeBuoy,
  Flame,
  ArrowRight,
  ExternalLink,
  Shield,
  Radio
} from 'lucide-react';
import { emergencyService } from '../services/emergencyService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const EmergencyPage = ({ onOpenEmergencyModal, onSelectIncident }) => {
  const { currentUser, isResponder, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('open');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await emergencyService.getEmergencyReports({
        status: statusFilter,
        severity: severityFilter,
        category: categoryFilter,
      });
      setIncidents(data);
    } catch (err) {
      console.warn('Failed to load emergency reports:', err);
      addToast('Error loading incident feed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();

    // Subscribe to live updates
    const unsubscribe = emergencyService.subscribeToEmergencies(() => {
      loadIncidents();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [statusFilter, severityFilter, categoryFilter]);

  const severityBadges = {
    critical: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
    high: 'bg-orange-100 text-orange-900 border-orange-300 font-bold',
    medium: 'bg-amber-100 text-amber-950 border-amber-300 font-semibold',
    low: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold',
  };

  const statusBadges = {
    reported: 'bg-slate-100 text-slate-800 border-slate-200',
    verified: 'bg-blue-100 text-blue-900 border-blue-200',
    assigned: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    in_progress: 'bg-amber-100 text-amber-900 border-amber-200',
    resolved: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-900 border-rose-200',
  };

  const categoryLabels = {
    medical: '🚑 Medical Assistance',
    flood_storm: '🌊 Flooding & Storm Surge',
    fire: '🔥 Fire / Smoke Hazard',
    structural: '🏚 Structural Collapse / Road Block',
    utility_outage: '⚡ Power & Heat Outage',
    search_rescue: '🔍 Search & Evacuation',
    supplies_food: '🥫 Survival Supplies',
    other: '⚠️ General Hazard',
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Emergency Incident Feed
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Community crisis alerts, field unit dispatch, and ground-level hazard reports
            </p>
          </div>
        </div>

        <button
          onClick={onOpenEmergencyModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md shadow-rose-600/20 transition-all hover:-translate-y-0.5 shrink-0"
        >
          <AlertTriangle className="w-4 h-4" />
          Report New Incident
        </button>
      </div>

      {/* Immediate Life Hazard Notice */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 text-white border border-rose-900/50 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-600/25 text-rose-400 border border-rose-500/25 shrink-0 mt-0.5">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Immediate Life Hazard Protocol</h3>
              <p className="text-sm text-rose-100/80 leading-relaxed mt-0.5">
                CloudMesh is a mutual aid platform — <strong className="text-white">NOT</strong> an official 911 dispatch service. Contact emergency services first for life-threatening situations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <a
              href="tel:911"
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg transition-all hover:-translate-y-0.5"
            >
              <PhoneCall className="w-4 h-4" />
              Call 911
            </a>
            <a
              href="tel:988"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm flex items-center gap-2 border border-slate-700 transition-all hover:-translate-y-0.5"
            >
              <LifeBuoy className="w-4 h-4" />
              988 Crisis Line
            </a>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="open">Active / Open</option>
              <option value="all">All Statuses</option>
              <option value="reported">Reported (Unverified)</option>
              <option value="verified">Verified</option>
              <option value="assigned">Assigned to Unit</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High Urgency</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low / Advisory</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Hazard Type
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">All Hazard Types</option>
              <option value="medical">🚑 Medical</option>
              <option value="flood_storm">🌊 Flood / Storm</option>
              <option value="fire">🔥 Fire / Smoke</option>
              <option value="structural">🏚 Structural</option>
              <option value="utility_outage">⚡ Power / Utilities</option>
              <option value="search_rescue">🔍 Search & Rescue</option>
              <option value="supplies_food">🥫 Emergency Supplies</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-500 w-fit mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No active incidents match your filter</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The neighborhood is calm, or all matching reports have been resolved.
          </p>
          <button
            onClick={onOpenEmergencyModal}
            className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl text-sm hover:bg-rose-700 transition-colors inline-flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Report an Incident
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => onSelectIncident(incident)}
              className={`p-5 sm:p-6 bg-white rounded-2xl border shadow-sm card-hover cursor-pointer transition-all flex flex-col gap-4 group ${
                incident.severity === 'critical'
                  ? 'border-rose-200 hover:border-rose-400'
                  : 'border-slate-200 hover:border-orange-300'
              }`}
            >
              {/* Badge row */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${severityBadges[incident.severity]}`}>
                    {incident.severity}
                  </span>
                  <span className="text-xs text-slate-700 font-semibold bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 truncate max-w-[160px]">
                    {categoryLabels[incident.category] || incident.category}
                  </span>
                  {incident.immediateDanger && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                      Life Threat
                    </span>
                  )}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${statusBadges[incident.status]}`}>
                  {incident.status.replace('_', ' ')}
                </span>
              </div>

              {/* Title & description */}
              <div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug group-hover:text-rose-600 transition-colors line-clamp-1 mb-1">
                  {incident.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2">
                  {incident.description}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-auto space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{incident.location}</span>
                  </div>
                  <div className="flex items-center gap-1 font-medium shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="truncate min-w-0">
                    {incident.assignedToName ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Assigned: {incident.assignedToName}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Awaiting responder</span>
                    )}
                  </div>
                  <span className="text-rose-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
                    Inspect
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hotline Quick Directory */}
      <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-black text-slate-900 text-base sm:text-lg">
            Emergency Hotlines & Disaster Support
          </h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Emergency Dispatch', number: '911 (US) • 112 (EU)', desc: 'Police, Fire, Ambulance', color: 'text-rose-600' },
            { label: 'Suicide & Crisis Line', number: 'Dial 988', desc: '24/7 Free & Confidential', color: 'text-blue-600' },
            { label: 'Poison Control', number: '1-800-222-1222', desc: 'Toxic exposure & chemicals', color: 'text-amber-700' },
            { label: 'FEMA Disaster Aid', number: '1-800-621-3362', desc: 'Federal relief & housing', color: 'text-indigo-700' },
          ].map(({ label, number, desc, color }) => (
            <div key={label} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">{label}</span>
              <div className={`text-base font-black ${color}`}>{number}</div>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
