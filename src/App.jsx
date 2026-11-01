import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { EmergencyBanner } from './components/EmergencyBanner';
import { AuthModal } from './components/AuthModal';
import { FirebaseStatusModal } from './components/FirebaseStatusModal';
import { OfferResourceModal } from './components/OfferResourceModal';
import { RequestResourceModal } from './components/RequestResourceModal';
import { ReportEmergencyModal } from './components/ReportEmergencyModal';
import { IncidentDetailModal } from './components/IncidentDetailModal';

import { DashboardPage } from './pages/DashboardPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [firebaseModalOpen, setFirebaseModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedResourceForRequest, setSelectedResourceForRequest] = useState(null);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [incidentDetailOpen, setIncidentDetailOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Key to trigger refresh on list updates
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenEditResource = (resource) => {
    setEditingResource(resource);
    setOfferModalOpen(true);
  };

  const handleOpenRequestResource = (resource) => {
    setSelectedResourceForRequest(resource);
    setRequestModalOpen(true);
  };

  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident);
    setIncidentDetailOpen(true);
  };

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Real-time Network Connectivity Observer */}
      <NetworkStatusBanner />

      {/* Top Critical Incident Alert Banner */}
      <EmergencyBanner onOpenEmergencyPage={() => setActiveTab('emergency')} />

      {/* Main Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenFirebaseModal={() => setFirebaseModalOpen(true)}
        onOpenOfferModal={() => { setEditingResource(null); setOfferModalOpen(true); }}
        onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
      />

      {/* Page Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'dashboard' && (
          <DashboardPage
            key={refreshKey}
            onNavigate={setActiveTab}
            onOpenOfferModal={() => { setEditingResource(null); setOfferModalOpen(true); }}
            onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
            onSelectResource={handleOpenRequestResource}
            onSelectIncident={handleSelectIncident}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesPage
            key={refreshKey}
            onOpenOfferModal={() => { setEditingResource(null); setOfferModalOpen(true); }}
            onOpenRequestModal={handleOpenRequestResource}
            onEditResource={handleOpenEditResource}
          />
        )}

        {activeTab === 'emergency' && (
          <EmergencyPage
            key={refreshKey}
            onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
            onSelectIncident={handleSelectIncident}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            key={refreshKey}
            onOpenOfferModal={() => { setEditingResource(null); setOfferModalOpen(true); }}
            onEditResource={handleOpenEditResource}
            onSelectIncident={handleSelectIncident}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPage
            key={refreshKey}
            onSelectIncident={handleSelectIncident}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenFirebaseModal={() => setFirebaseModalOpen(true)}
      />

      {/* Modals & Dialogs */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <FirebaseStatusModal
        isOpen={firebaseModalOpen}
        onClose={() => setFirebaseModalOpen(false)}
      />

      <OfferResourceModal
        isOpen={offerModalOpen}
        onClose={() => { setOfferModalOpen(false); setEditingResource(null); }}
        onSuccess={triggerRefresh}
        initialData={editingResource}
      />

      <RequestResourceModal
        isOpen={requestModalOpen}
        onClose={() => { setRequestModalOpen(false); setSelectedResourceForRequest(null); }}
        resource={selectedResourceForRequest}
        onSuccess={triggerRefresh}
      />

      <ReportEmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        onSuccess={triggerRefresh}
      />

      <IncidentDetailModal
        isOpen={incidentDetailOpen}
        onClose={() => { setIncidentDetailOpen(false); setSelectedIncident(null); }}
        incident={selectedIncident}
        onIncidentUpdated={triggerRefresh}
        onRequestResource={handleOpenRequestResource}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
