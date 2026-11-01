import React from 'react';
import { X, Database, ShieldCheck, Flame, ExternalLink, Check, Copy, HelpCircle } from 'lucide-react';
import { isFirebaseConfigured, firebaseConfig } from '../lib/firebase';

export const FirebaseStatusModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const envSample = `VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:...`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isFirebaseConfigured ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">Firebase Connection Status</h3>
              <p className="text-sm text-slate-500">Cloud Firestore & Modular SDK Architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 overflow-y-auto space-y-5 text-sm text-slate-600 pr-1">
          {/* Status Badge */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            isFirebaseConfigured
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}>
            <div className="mt-1 shrink-0">
              {isFirebaseConfigured ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <HelpCircle className="w-5 h-5 text-amber-600" />}
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="font-bold flex flex-wrap items-center gap-2">
                <span>{isFirebaseConfigured ? 'Live Firebase Integration Active' : 'Running in Local Persistence Mode'}</span>
                <span className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                  isFirebaseConfigured ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-900'
                }`}>
                  {isFirebaseConfigured ? 'Live Cloud' : 'Persistent Storage'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isFirebaseConfigured
                  ? `Connected to Firebase Project: "${firebaseConfig.projectId}". Reads and writes persist directly to Cloud Firestore.`
                  : 'All core modules (Authentication, Resource Exchange, Emergency Dispatch, Notifications) are fully functioning with persistent browser storage and seed data. To connect to live Firebase, follow the 4 steps below.'}
              </p>
            </div>
          </div>

          {/* Quick Setup Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              {isFirebaseConfigured ? 'Current Configuration' : 'Connecting Real Firebase Project (4 Easy Steps)'}
            </h4>

            {isFirebaseConfigured ? (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-xs space-y-2 text-slate-700">
                <div><span className="text-slate-400">Project ID:</span> {firebaseConfig.projectId}</div>
                <div><span className="text-slate-400">Auth Domain:</span> {firebaseConfig.authDomain}</div>
                <div><span className="text-slate-400">Storage Bucket:</span> {firebaseConfig.storageBucket || '(Not requested)'}</div>
                <div><span className="text-slate-400">Modular SDK:</span> v11+ Modular (Tree-shaken)</div>
              </div>
            ) : (
              <div className="space-y-3">
                <ol className="space-y-2.5 text-xs sm:text-sm text-slate-700 list-decimal list-inside bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                  <li className="leading-relaxed">
                    <strong className="text-slate-900">Create a Project:</strong> Visit <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3.5 h-3.5" /></a> and click <em>"Add Project"</em>.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-slate-900">Enable Auth:</strong> In Firebase Console &gt; <em>Build</em> &gt; <em>Authentication</em> &gt; <em>Sign-in method</em>, enable <strong>Email/Password</strong>.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-slate-900">Create Cloud Firestore:</strong> Go to <em>Firestore Database</em> &gt; <em>Create database</em>. Deploy rules from <code>firestore.rules</code>.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-slate-900">Add Web App & .env:</strong> In Project Settings &gt; <em>General</em> &gt; <em>Your apps</em>, add a Web App. Copy keys into <code>.env</code> in this workspace!
                  </li>
                </ol>

                <div className="relative">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    <span>Example .env Format:</span>
                    <button
                      onClick={handleCopy}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold normal-case"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy template'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                    {envSample}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  );
};
