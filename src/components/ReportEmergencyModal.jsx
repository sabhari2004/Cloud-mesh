import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  PhoneCall,
  MapPin,
  Sparkles,
  ShieldAlert,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { emergencyService } from '../services/emergencyService';
import { aiService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export const ReportEmergencyModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [severity, setSeverity] = useState('high');
  const [immediateDanger, setImmediateDanger] = useState(false);
  const [contactName, setContactName] = useState(currentUser?.displayName || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AI Triage suggestions state
  const [aiTriage, setAiTriage] = useState(null);
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);

  // Fetch active reports to check for duplicates
  const [existingReports, setExistingReports] = useState([]);

  useEffect(() => {
    if (isOpen) {
      emergencyService.getEmergencyReports({ status: 'open' }).then(setExistingReports).catch(console.warn);
      // Reset defaults
      setTitle('');
      setDescription('');
      setCategory('other');
      setLocation(currentUser?.location || '');
      setSeverity('high');
      setImmediateDanger(false);
      setContactName(currentUser?.displayName || '');
      setContactPhone(currentUser?.phone || '');
      setAiTriage(null);
      setPotentialDuplicates([]);
      setError('');
    }
  }, [isOpen, currentUser]);

  // Run AI classification as user types
  useEffect(() => {
    if (description.trim().length > 15) {
      const result = aiService.classifyEmergency(title + ' ' + description, category);
      setAiTriage(result);

      // Check duplicates
      const dups = aiService.detectDuplicateReports(description, location, existingReports);
      setPotentialDuplicates(dups);
    } else {
      setAiTriage(null);
      setPotentialDuplicates([]);
    }
  }, [description, title, location, category, existingReports]);

  if (!isOpen) return null;

  const handleApplyAiSuggestion = () => {
    if (aiTriage) {
      setSeverity(aiTriage.severity);
      if (aiTriage.suggestedCategory && aiTriage.suggestedCategory !== 'other') {
        setCategory(aiTriage.suggestedCategory);
      }
      addToast('Applied AI Triage recommendations', 'info');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Please provide a title, incident description, and location.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await emergencyService.createEmergencyReport({
        title,
        description,
        category,
        location,
        severity,
        immediateDanger,
        contactName,
        contactPhone,
      }, currentUser);

      addToast('Emergency report dispatched to local responders and community board', 'warning');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit emergency report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 shadow-2xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                Report Community Emergency Incident
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Alert neighborhood volunteers and coordinate field dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 911 Callout Notice */}
        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">
              If human lives or properties are in immediate danger, dial <strong>911 / 112</strong> first.
            </span>
          </div>
          <a
            href="tel:911"
            className="shrink-0 font-bold bg-rose-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-rose-700 flex items-center gap-1.5 shadow-sm text-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 911</span>
          </a>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 overflow-y-auto space-y-4 pr-1 text-sm">
          {/* Incident Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Incident Headline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Flash Flood Inundation on Lower Elm St, Downed Power Line"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Exact Location / Landmark <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Street address, cross-streets, or neighborhood quadrant"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* Incident Category & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-semibold capitalize"
              >
                <option value="medical">🚑 Medical Assistance Needed</option>
                <option value="flood_storm">🌊 Flood / Storm Surge</option>
                <option value="fire">🔥 Fire / Smoke Hazard</option>
                <option value="structural">🏚 Structural Damage / Tree Down</option>
                <option value="utility_outage">⚡ Power / Utility Outage</option>
                <option value="search_rescue">🔍 Search & Evacuation</option>
                <option value="supplies_food">🥫 Emergency Supplies & Food</option>
                <option value="other">⚠️ Other Urgent Hazard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Severity Rating</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-bold"
              >
                <option value="critical" className="text-rose-700 font-bold">🔴 Critical (Immediate Life/Safety Hazard)</option>
                <option value="high" className="text-orange-700 font-semibold">🟠 High (Urgent Response Needed)</option>
                <option value="medium" className="text-amber-700">🟡 Medium (Moderate Neighborhood Risk)</option>
                <option value="low" className="text-slate-700">🟢 Low (Advisory / Non-Immediate)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Detailed Situation Report <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="3"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State what is occurring, how many people are affected, road hazards, or supplies needed..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium leading-relaxed"
            ></textarea>
          </div>

          {/* Real-time AI Triage Assistant Card */}
          {aiTriage && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl animate-in fade-in space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>AI Triage Assessment ({aiTriage.score}% Urgency Score)</span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyAiSuggestion}
                  className="text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-lg transition-colors"
                >
                  Apply Suggestion
                </button>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Based on incident wording, recommended severity is <strong className="uppercase">{aiTriage.severity}</strong> ({aiTriage.suggestedCategory.replace('_', ' ')}).
                {aiTriage.detectedFactors.length > 0 && ` Detected: ${aiTriage.detectedFactors.join(', ')}.`}
              </p>
            </div>
          )}

          {/* Duplicate Detection Alert */}
          {potentialDuplicates.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs sm:text-sm text-amber-950 animate-in fade-in space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Possible Duplicate Report Detected ({potentialDuplicates[0].similarityScore}% Match)</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                A similar active incident was already logged nearby: <span className="font-semibold">"{potentialDuplicates[0].report.title}"</span> at {potentialDuplicates[0].report.location}. Please confirm this is a new event before submitting.
              </p>
            </div>
          )}

          {/* Immediate Danger Checkbox */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={immediateDanger}
                onChange={(e) => setImmediateDanger(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
              />
              <span className="text-xs sm:text-sm font-bold text-rose-900">
                Immediate Hazard: Active structural collapse, rising water indoors, or extreme life peril
              </span>
            </label>
          </div>

          {/* Reporter Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Your Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Name or Anonymous"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Callback Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="For responder callback"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-rose-600/25 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dispatch Emergency Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
