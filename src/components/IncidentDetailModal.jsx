import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  MapPin,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
  Sparkles,
  Loader2,
  Send
} from 'lucide-react';
import { emergencyService } from '../services/emergencyService';
import { resourceService } from '../services/resourceService';
import { aiService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export const IncidentDetailModal = ({
  isOpen,
  onClose,
  incident,
  onIncidentUpdated,
  onRequestResource
}) => {
  const { currentUser, isResponder, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [status, setStatus] = useState(incident?.status || 'reported');
  const [responderNotes, setResponderNotes] = useState(incident?.responderNotes || '');
  const [loading, setLoading] = useState(false);
  const [matchingResources, setMatchingResources] = useState([]);

  useEffect(() => {
    if (incident) {
      setStatus(incident.status);
      setResponderNotes(incident.responderNotes || '');

      // Load matching community resources
      resourceService.getResources({ availability: 'available' }).then((resources) => {
        const matches = aiService.findMatchingResources(
          incident.title + ' ' + incident.description,
          incident.category,
          resources
        );
        setMatchingResources(matches);
      }).catch(console.warn);
    }
  }, [incident]);

  if (!isOpen || !incident) return null;

  const canManageTriage = isResponder || isAdmin;

  const handleUpdateTriage = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const assignedTo = status === 'assigned' || status === 'in_progress'
        ? (incident.assignedTo || (currentUser.uid || currentUser.id))
        : incident.assignedTo;

      const assignedToName = status === 'assigned' || status === 'in_progress'
        ? (incident.assignedToName || currentUser.displayName)
        : incident.assignedToName;

      await emergencyService.updateIncidentStatus(
        incident.id,
        {
          status,
          responderNotes,
          assignedTo,
          assignedToName,
        },
        currentUser
      );

      addToast(`Incident status updated to "${status.toUpperCase()}"`, 'success');
      onIncidentUpdated();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to update triage status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const severityColors = {
    critical: 'bg-rose-100 text-rose-800 border-rose-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };

  const statusColors = {
    reported: 'bg-slate-100 text-slate-700 border-slate-200',
    verified: 'bg-blue-100 text-blue-800 border-blue-200',
    assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl sm:max-w-3xl w-full p-6 sm:p-8 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${severityColors[incident.severity]}`}>
                {incident.severity} Severity
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusColors[incident.status]}`}>
                {incident.status.replace('_', ' ')}
              </span>
              {incident.immediateDanger && (
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-600 text-white animate-pulse">
                  Immediate Life Danger
                </span>
              )}
            </div>
            <h3 className="font-black text-slate-900 text-xl sm:text-2xl leading-tight">
              {incident.title}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                {incident.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                {new Date(incident.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 overflow-y-auto space-y-5 pr-1 text-sm">
          {/* Situation Description */}
          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Situation Report</h4>
            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">{incident.description}</p>
          </div>

          {/* Reporter & Responder Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">Reporting Source</span>
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <User className="w-4 h-4 text-slate-400" />
                <span>{incident.reporterName}</span>
              </div>
              {incident.reporterContact && (
                <div className="flex items-center gap-2 text-slate-600 font-medium text-xs">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${incident.reporterContact}`} className="text-blue-600 hover:underline">
                    {incident.reporterContact}
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">Assigned First Responder</span>
              <div className="font-bold text-slate-800">
                {incident.assignedToName ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {incident.assignedToName}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Unassigned (Awaiting dispatch)</span>
                )}
              </div>
            </div>
          </div>

          {/* AI Matching Community Supplies */}
          {matchingResources.length > 0 && (
            <div className="p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-blue-950">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>AI Recommended Community Resources for this Emergency</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {matchingResources.map(({ resource, matchScore }) => (
                  <div
                    key={resource.id}
                    className="p-3.5 bg-white rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                          {matchScore}% Match
                        </span>
                        <h5 className="font-bold text-slate-900 text-sm">{resource.title}</h5>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {resource.quantity} {resource.unit} • {resource.location} (Owner: {resource.ownerName})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onRequestResource) onRequestResource(resource);
                      }}
                      className="shrink-0 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors"
                    >
                      Request Aid
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Responder Dispatch & Triage Management (Responders & Admins Only) */}
          {canManageTriage ? (
            <form onSubmit={handleUpdateTriage} className="p-5 sm:p-6 bg-slate-900 text-white rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Responder & Incident Command Triage
                </h4>
                <span className="text-xs text-slate-400">Authorized: {currentUser.displayName}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-800">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Update Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 text-white border border-slate-700 rounded-xl text-sm capitalize focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                  >
                    <option value="reported">Reported (Pending review)</option>
                    <option value="verified">Verified (Confirmed on ground)</option>
                    <option value="assigned">Assigned (Responder dispatched)</option>
                    <option value="in_progress">In Progress (Active operations)</option>
                    <option value="resolved">Resolved (Completed safely)</option>
                    <option value="rejected">Rejected (False alarm / duplicate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Field Responder</label>
                  <div className="text-sm bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-medium">
                    {incident.assignedToName || currentUser.displayName} ({currentUser.role})
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Field Notes & Tactical Log
                </label>
                <textarea
                  rows="2"
                  value={responderNotes}
                  onChange={(e) => setResponderNotes(e.target.value)}
                  placeholder="Record responder ETA, resource deployment, victims aided, or clearance instructions..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 text-white border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                ></textarea>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Save Triage Updates
                </button>
              </div>
            </form>
          ) : (
            incident.responderNotes && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5">
                <span className="font-bold text-amber-900 text-xs uppercase tracking-wider">Official Responder Log:</span>
                <p className="text-sm text-amber-900 font-medium">{incident.responderNotes}</p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
