import React from 'react';
import { ShieldCheck, Heart, Flame, ShieldAlert, ExternalLink } from 'lucide-react';
import { isFirebaseConfigured, firebaseConfig } from '../lib/firebase';

export const Footer = ({ onOpenFirebaseModal }) => {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand Info */}
          <div className="sm:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm">
                CM
              </div>
              <span className="font-extrabold text-lg tracking-tight">CloudMesh</span>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              "Connecting Communities. Sharing Resources. Responding Together." An open-source, resilient community platform for mutual aid, medical supply coordination, and local emergency crisis response.
            </p>

            {/* Inline disclaimer — compact & unobtrusive */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-900/50 text-xs text-rose-200/80 leading-relaxed">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Important:</strong> CloudMesh is NOT an official emergency dispatch. For life-threatening emergencies call{' '}
                <a href="tel:911" className="text-rose-300 font-bold hover:underline">911 (US/CA)</a>
                {' '}or{' '}
                <a href="tel:112" className="text-rose-300 font-bold hover:underline">112 (EU/Global)</a>
                {' '}immediately.
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Least-Privilege Cloud Firestore Security Rules Active</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Platform Modules</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400 font-medium">
              <li className="hover:text-slate-200 transition-colors cursor-pointer">• Community Resource Exchange</li>
              <li className="hover:text-slate-200 transition-colors cursor-pointer">• Emergency Incident Triage Feed</li>
              <li className="hover:text-slate-200 transition-colors cursor-pointer">• Volunteer Responder Dispatch</li>
              <li className="hover:text-slate-200 transition-colors cursor-pointer">• AI-Assisted Urgency Categorization</li>
              <li className="hover:text-slate-200 transition-colors cursor-pointer">• Real-Time Mutual Aid Notifications</li>
            </ul>
          </div>

          {/* Infrastructure */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Database & Security</h4>
            <button
              onClick={onOpenFirebaseModal}
              className="w-full text-left p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Flame className={`w-5 h-5 shrink-0 ${isFirebaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
                <div>
                  <div className="font-bold text-white text-xs">
                    {isFirebaseConfigured ? 'Live Firebase Firestore' : 'Local Persistence Mode'}
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">
                    {isFirebaseConfigured ? firebaseConfig.projectId : 'Click for setup steps'}
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
            </button>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-xs font-medium">
          <p>© {new Date().getFullYear()} CloudMesh Community Resilience Initiative. Built for mutual survival and support.</p>
          <div className="flex items-center gap-1.5">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for neighborhoods
          </div>
        </div>
      </div>
    </footer>
  );
};
