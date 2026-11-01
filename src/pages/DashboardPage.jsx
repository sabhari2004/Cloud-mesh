import React, { useState, useEffect } from 'react';
import {
  Layers,
  ShieldAlert,
  HandHeart,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  Package,
  PlusCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  PhoneCall,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { resourceService } from '../services/resourceService';
import { requestService } from '../services/requestService';
import { emergencyService } from '../services/emergencyService';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = ({
  onNavigate,
  onOpenOfferModal,
  onOpenEmergencyModal,
  onSelectResource,
  onSelectIncident
}) => {
  const { currentUser, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    availableResources: 0,
    activeRequests: 0,
    openEmergencies: 0,
    completedExchanges: 0,
  });

  const [recentResources, setRecentResources] = useState([]);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');

  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setError(null);
    try {
      const [resources, emergencies, requestStats] = await Promise.all([
        resourceService.getResources({ limitCount: 50 }),
        emergencyService.getEmergencyReports({ status: 'all' }),
        requestService.getRequestStats(),
      ]);

      const availableCount = resources.filter((r) => r.availability === 'available' || r.availability === 'partially_available').length;
      const openEmg = emergencies.filter((e) => ['reported', 'verified', 'assigned', 'in_progress'].includes(e.status)).length;
      const resolvedEmg = emergencies.filter((e) => e.status === 'resolved').length;

      setStats({
        availableResources: availableCount,
        activeRequests: requestStats.activeCount,
        openEmergencies: openEmg,
        completedExchanges: requestStats.completedCount + resolvedEmg,
      });

      setRecentResources(resources.slice(0, 6));
      setActiveEmergencies(emergencies.filter((e) => ['reported', 'verified', 'assigned', 'in_progress'].includes(e.status)).slice(0, 4));
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
      setError('Unable to load live dashboard feeds. Please check network connection or retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const filteredResources = filterCategory === 'all'
    ? recentResources
    : recentResources.filter((r) => r.category === filterCategory);

  const categoryIcons = {
    food: '🥫',
    water: '💧',
    medical: '🩹',
    shelter: '🏠',
    clothing: '👕',
    equipment: '⚡',
    transportation: '🚚',
    other: '📦',
  };

  return (
    <div className="space-y-10 animate-in fade-in pb-20">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 text-white p-8 sm:p-10 lg:p-12 shadow-xl border border-indigo-900/40">
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/25 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Community Mutual Aid Network — Active
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Connecting Communities.{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-200 bg-clip-text text-transparent">
                Sharing Resources. Responding Together.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
              CloudMesh is your local neighborhood resilience hub — share food, water, medical gear, and volunteer-power to coordinate immediate response when crises strike.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onOpenOfferModal}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Offer a Resource
              </button>
              <button
                onClick={onOpenEmergencyModal}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-600/25 transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Report Emergency
              </button>
              <button
                onClick={() => onNavigate('resources')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm border border-white/20 transition-all backdrop-blur-md flex items-center gap-1.5"
              >
                Explore Supplies
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Live Network Snapshot */}
          <div className="lg:col-span-5 bg-white/8 backdrop-blur-md border border-white/12 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span className="font-bold text-xs uppercase tracking-widest text-cyan-200">
                  Live Network Status
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Active Incidents', value: `${stats.openEmergencies} logged`, color: 'bg-rose-400', textColor: 'text-rose-300' },
                { label: 'Available Resources', value: `${stats.availableResources} listed`, color: 'bg-blue-400', textColor: 'text-cyan-300' },
                { label: 'Completed Deliveries', value: `${stats.completedExchanges} verified`, color: 'bg-emerald-400', textColor: 'text-emerald-300' },
              ].map(({ label, value, color, textColor }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-slate-300 text-sm font-medium">{label}</span>
                  </div>
                  <span className={`font-black text-sm ${textColor}`}>{value}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              Data syncs with local peer network and Cloud Firestore.
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-900 text-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[
          {
            label: 'Available Resources',
            value: stats.availableResources,
            icon: Package,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            note: 'Active community listings',
            noteColor: 'text-emerald-700',
          },
          {
            label: 'Active Aid Requests',
            value: stats.activeRequests,
            icon: HandHeart,
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            note: 'Neighbors requesting aid',
            noteColor: 'text-indigo-700',
          },
          {
            label: 'Open Incidents',
            value: stats.openEmergencies,
            icon: ShieldAlert,
            iconBg: 'bg-rose-50',
            iconColor: 'text-rose-600',
            valueColor: 'text-rose-600',
            note: 'Awaiting responder dispatch',
            noteColor: 'text-rose-700',
          },
          {
            label: 'Completed Deliveries',
            value: stats.completedExchanges,
            icon: CheckCircle2,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            note: 'Verified mutual aid',
            noteColor: 'text-emerald-700',
          },
        ].map(({ label, value, icon: Icon, iconBg, iconColor, valueColor, note, noteColor }) => (
          <div key={label} className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
              <div className={`p-2 rounded-xl ${iconBg}`}>
                <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
              </div>
            </div>
            <div className={`text-3xl sm:text-4xl font-black tracking-tight ${valueColor || 'text-slate-900'}`}>
              {loading ? <span className="text-slate-300">—</span> : value}
            </div>
            <p className={`text-xs font-semibold flex items-center gap-1.5 ${noteColor}`}>
              {!valueColor && <TrendingUp className="w-3.5 h-3.5" />}
              {note}
            </p>
          </div>
        ))}
      </div>

      {/* Active Emergencies */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Active Emergency Feed
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Live ground-level hazard reports and responder alerts
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('emergency')}
            className="text-sm font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1.5 group self-start sm:self-auto"
          >
            View all reports
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        ) : activeEmergencies.length === 0 ? (
          <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm font-medium">
            No active emergencies — community status is calm. 🌿
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {activeEmergencies.map((emg) => (
              <div
                key={emg.id}
                onClick={() => onSelectIncident(emg)}
                className={`p-5 sm:p-6 bg-white rounded-2xl border shadow-sm card-hover cursor-pointer transition-all group ${
                  emg.severity === 'critical'
                    ? 'border-rose-200 hover:border-rose-400'
                    : 'border-slate-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                      emg.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : emg.severity === 'high'
                        ? 'bg-orange-100 text-orange-800 border-orange-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {emg.severity}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      {emg.category.replace('_', ' ')}
                    </span>
                    {emg.immediateDanger && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        Life Threat
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 shrink-0">
                    {emg.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug group-hover:text-rose-600 transition-colors line-clamp-1 mb-1">
                  {emg.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {emg.description}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700 truncate min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emg.location}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-rose-600 group-hover:text-rose-700 shrink-0">
                    Inspect
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Resource Catalog */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Community Resource Catalog
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Mutual aid inventory shared by community volunteers
              </p>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['all', 'food', 'water', 'medical', 'equipment', 'shelter'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'all' ? 'All Supplies' : `${categoryIcons[cat] || ''} ${cat}`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm font-medium">
            No resources in this category.{' '}
            <button onClick={onOpenOfferModal} className="text-blue-600 font-bold hover:underline">
              Be the first to offer one!
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredResources.map((res) => (
              <div
                key={res.id}
                onClick={() => onSelectResource(res)}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm card-hover hover:border-blue-300 cursor-pointer transition-all flex flex-col gap-4 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {categoryIcons[res.category] || '📦'} {res.category}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                      res.availability === 'available'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : res.availability === 'partially_available'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {res.availability.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {res.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3 mt-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-slate-900 text-lg">{res.quantity}</span>{' '}
                      <span className="text-slate-500 font-bold uppercase text-xs">{res.unit}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium truncate max-w-[140px]">
                      {res.location}
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectResource(res); }}
                    className="w-full py-2 bg-slate-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold rounded-xl text-xs transition-all text-center flex items-center justify-center gap-1.5 border border-slate-200 hover:border-blue-600"
                  >
                    Request Resource
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Emergency Hotlines */}
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-3 text-center lg:text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/70 px-3.5 py-1.5 rounded-full border border-rose-800/50">
            <PhoneCall className="w-3.5 h-3.5" />
            Official Dispatch Lines
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            Emergency Services Are Priority #1
          </h3>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            CloudMesh is an auxiliary mutual-aid network. It does <strong className="text-slate-200">not</strong> replace 911 or governmental emergency services. Contact emergency operators first for life-threatening situations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
          <a
            href="tel:911"
            className="w-full sm:w-auto px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl transition-all shadow-xl shadow-rose-600/25 flex items-center justify-center gap-2.5 hover:-translate-y-0.5"
          >
            <PhoneCall className="w-5 h-5" />
            Call 911 (North America)
          </a>
          <a
            href="tel:112"
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-2xl transition-all border border-slate-700 flex items-center justify-center gap-2.5 hover:-translate-y-0.5"
          >
            <PhoneCall className="w-5 h-5" />
            Call 112 (Europe/Global)
          </a>
        </div>
      </div>
    </div>
  );
};
