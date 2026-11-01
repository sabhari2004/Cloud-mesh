import React, { useState } from 'react';
import {
  Activity,
  Layers,
  ShieldAlert,
  User,
  Settings,
  Menu,
  X,
  Flame,
  ChevronDown,
  LogOut,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import { RoleBadge } from './RoleBadge';

export const Navbar = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenFirebaseModal,
  onOpenOfferModal,
  onOpenEmergencyModal
}) => {
  const { currentUser, logout, role, isAdmin, isResponder, isFirebaseLive, quickSwitchRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'resources', label: 'Resources', icon: Layers },
    { id: 'emergency', label: 'Emergency Feed', icon: ShieldAlert, highlight: true },
    { id: 'profile', label: 'My Activity', icon: User },
  ];

  if (isResponder || isAdmin) {
    navItems.push({ id: 'admin', label: 'Command Console', icon: Settings });
  }

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleRoleSelect = (targetRole) => {
    quickSwitchRole(targetRole);
    setRoleMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-4 lg:gap-8 shrink-0 min-w-0">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-transform">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  CloudMesh
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-emerald-200 animate-pulse ml-1.5 mb-0.5" />
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? item.highlight
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                        : item.highlight
                        ? 'text-rose-600 hover:bg-rose-50/70'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.highlight && isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Report Emergency */}
            <button
              onClick={onOpenEmergencyModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-sm shrink-0"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report</span>
            </button>

            {/* Firebase Status */}
            <button
              onClick={onOpenFirebaseModal}
              title="Firebase connection status"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                isFirebaseLive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${isFirebaseLive ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>{isFirebaseLive ? 'Live' : 'Local'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseLive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </button>

            {/* Notifications */}
            {currentUser && <NotificationDropdown onNavigate={handleNavClick} />}

            {/* User Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="flex items-center gap-1.5 p-1 sm:pl-1 sm:pr-2.5 sm:py-1 rounded-lg text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 shrink-0"
                  aria-label="User profile and role menu"
                >
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="block text-xs font-bold text-slate-900 max-w-[80px] truncate leading-tight">
                      {currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'User'}
                    </span>
                    <span className="block text-[10px] uppercase font-bold text-slate-500 leading-tight">
                      {role}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                </button>

                {roleMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="font-bold text-slate-900 text-sm">
                        {currentUser.displayName || 'Current User'}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {currentUser.email || 'Active Session'}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <RoleBadge role={role} size="xs" />
                        <span className="text-[11px] text-slate-400">active role</span>
                      </div>
                    </div>

                    <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Persona
                    </div>
                    {[
                      { r: 'admin', name: 'Elena Rostova', desc: 'Municipal Coordinator' },
                      { r: 'responder', name: 'Marcus Chen, EMT', desc: 'Field Unit Lead' },
                      { r: 'user', name: 'Sarah Miller', desc: 'Neighbor Volunteer' },
                    ].map(({ r, name, desc }) => (
                      <button
                        key={r}
                        onClick={() => handleRoleSelect(r)}
                        className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors ${
                          role === r ? 'bg-slate-50 font-bold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{name}</div>
                          <div className="text-slate-500 mt-0.5">{desc}</div>
                        </div>
                        <RoleBadge role={r} size="xs" />
                      </button>
                    ))}

                    <div className="pt-2 mt-1 border-t border-slate-100 px-2 space-y-0.5">
                      <button
                        onClick={() => { handleNavClick('profile'); setRoleMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>My Activity</span>
                      </button>
                      <button
                        onClick={() => { logout(); setRoleMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm shadow-blue-500/20 shrink-0"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 sm:px-6 py-5 space-y-4 animate-in slide-in-from-top-2 shadow-lg">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => { onOpenOfferModal(); setMobileMenuOpen(false); }}
              className="py-2.5 px-3 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Offer Resource
            </button>
            <button
              onClick={() => { onOpenEmergencyModal(); setMobileMenuOpen(false); }}
              className="py-2.5 px-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              Report Emergency
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? item.highlight
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${item.highlight ? 'text-rose-500' : isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && (
                    <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
