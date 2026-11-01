import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  HandHeart,
  ShieldAlert,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  MapPin,
  Mail,
  Loader2,
  AlertCircle,
  Inbox,
  Send,
  PlusCircle
} from 'lucide-react';
import { resourceService } from '../services/resourceService';
import { requestService } from '../services/requestService';
import { emergencyService } from '../services/emergencyService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { RoleBadge } from '../components/RoleBadge';

export const ProfilePage = ({
  initialTab = 'resources',
  onOpenOfferModal,
  onEditResource,
  onSelectIncident
}) => {
  const { currentUser, updateProfileData } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  // Profile Form States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // History datasets
  const [myResources, setMyResources] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [myEmergencies, setMyEmergencies] = useState([]);

  // Decision state for incoming requests
  const [decisionNotes, setDecisionNotes] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const userId = currentUser?.uid || currentUser?.id;

  const loadUserData = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const [resources, incoming, sent, emergencies] = await Promise.all([
        resourceService.getUserResources(userId),
        requestService.getOwnerRequests(userId),
        requestService.getUserRequests(userId),
        emergencyService.getUserEmergencyReports(userId),
      ]);

      setMyResources(resources);
      setIncomingRequests(incoming);
      setSentRequests(sent);
      setMyEmergencies(emergencies);
    } catch (err) {
      console.warn('Failed to load profile datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhone(currentUser.phone || '');
      setLocation(currentUser.location || '');
      setBio(currentUser.bio || '');
      loadUserData();
    }
  }, [currentUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfileData({ displayName, phone, location, bio });
      addToast('Profile updated successfully!', 'success');
      setIsEditingProfile(false);
    } catch (err) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestDecision = async (requestId, newStatus) => {
    setActionLoading(requestId);
    try {
      const notes = decisionNotes[requestId] || '';
      await requestService.updateRequestStatus(requestId, newStatus, notes, currentUser);
      addToast(`Request marked as "${newStatus.toUpperCase()}"`, 'success');
      loadUserData();
    } catch (err) {
      addToast(err.message || 'Failed to update request', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteResource = async (id, title) => {
    if (!window.confirm(`Delete listing "${title}"?`)) return;
    try {
      await resourceService.deleteResource(id, currentUser);
      addToast('Resource removed', 'info');
      loadUserData();
    } catch (err) {
      addToast(err.message || 'Failed to delete listing', 'error');
    }
  };

  if (!currentUser) {
    return (
      <div className="p-12 sm:p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto shadow-sm my-12">
        <User className="w-14 h-14 text-slate-300 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900">Please Sign In</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Sign in or switch evaluation roles to view your mutual aid activity, managed supplies, and emergency dispatches.
        </p>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-amber-100 text-amber-900 border-amber-300',
    accepted: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    rejected: 'bg-rose-100 text-rose-900 border-rose-300',
    completed: 'bg-blue-100 text-blue-900 border-blue-300',
    cancelled: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-16">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shadow-blue-500/25 shrink-0">
              {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {currentUser.displayName || 'Community Member'}
                </h1>
                <RoleBadge role={currentUser.role} size="sm" />
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {currentUser.status || 'Active'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {currentUser.email}
                </span>
                {currentUser.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {currentUser.phone}
                  </span>
                )}
                {currentUser.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {currentUser.location}
                  </span>
                )}
              </div>
              {currentUser.bio && (
                <p className="text-sm text-slate-600 pt-1 italic font-normal leading-relaxed">{currentUser.bio}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-colors shrink-0 shadow-2xs"
          >
            <Edit2 className="w-4 h-4" />
            <span>{isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Profile Edit Drawer Form */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-7 pt-7 border-t border-slate-100 space-y-5 animate-in fade-in">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
              Update Profile Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Neighborhood / Ward
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Ward 4, Westside"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Community Bio
              </label>
              <textarea
                rows="3"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your skills, equipment, or mutual aid interests..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Activity Navigation Tabs - Scrollable horizontal pill strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-200">
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'resources'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Offered Resources ({myResources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'incoming'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Incoming Requests ({incomingRequests.length})</span>
          {incomingRequests.filter((r) => r.status === 'pending').length > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'sent'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>My Sent Requests ({sentRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('emergencies')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'emergencies'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>My Emergency Reports ({myEmergencies.length})</span>
        </button>
      </div>

      {/* Tab 1: My Offered Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Listings you currently have active on the exchange</p>
            <button
              onClick={onOpenOfferModal}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-2xl text-xs sm:text-sm border border-blue-200 transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Offer Another Resource</span>
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : myResources.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-lg font-bold text-slate-800">You haven't listed any resources yet</h4>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Share drinking water, food, emergency tools, or shelter to aid your neighborhood.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {myResources.map((res) => (
                <div
                  key={res.id}
                  className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm card-hover flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                        {res.category}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                        {res.availability}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-lg">{res.title}</h4>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{res.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="font-black text-slate-900 text-base">
                      {res.quantity} {res.unit}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditResource(res)}
                        className="p-2 text-slate-600 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteResource(res.id, res.title)}
                        className="p-2 text-slate-600 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Incoming Requests (Owner Decision Center) */}
      {activeTab === 'incoming' && (
        <div className="space-y-5">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Neighbors requesting supplies from your listings. You can approve, decline, or complete each request.
          </p>

          {loading ? (
            <div className="h-36 bg-slate-100 rounded-3xl animate-pulse"></div>
          ) : incomingRequests.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-lg font-bold text-slate-800">No incoming requests yet</h4>
              <p className="text-sm text-slate-500">When neighbors request items you posted, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusColors[req.status]}`}>
                          {req.status}
                        </span>
                        <span className="text-sm text-slate-600 font-medium">
                          Item: <strong className="text-slate-900">{req.resourceTitle}</strong>
                        </span>
                      </div>
                      <div className="text-base font-extrabold text-slate-900 mt-1.5">
                        Requested Quantity: {req.requestedQuantity} units
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-xs sm:text-sm text-slate-500">
                      <div>Requester: <strong className="text-slate-900">{req.requesterName}</strong></div>
                      {req.requesterContact && (
                        <div className="text-xs text-blue-600 font-semibold">{req.requesterContact}</div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-700 space-y-1.5 border border-slate-200/60">
                    <span className="font-bold text-slate-500 text-xs uppercase tracking-wider">Requester Message:</span>
                    <p className="leading-relaxed">{req.notes || 'No extra notes provided.'}</p>
                    {req.neededByDate && (
                      <p className="text-xs text-amber-800 font-bold">Needed by: {req.neededByDate}</p>
                    )}
                  </div>

                  {req.decisionNotes && (
                    <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs sm:text-sm text-blue-900">
                      <span className="font-bold">Your Response Note:</span> {req.decisionNotes}
                    </div>
                  )}

                  {/* Owner Action Buttons */}
                  {req.status === 'pending' && (
                    <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
                      <input
                        type="text"
                        placeholder="Optional pickup instructions or note to requester..."
                        value={decisionNotes[req.id] || ''}
                        onChange={(e) => setDecisionNotes({ ...decisionNotes, [req.id]: e.target.value })}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white flex-1"
                      />

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => handleRequestDecision(req.id, 'accepted')}
                          disabled={actionLoading === req.id}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRequestDecision(req.id, 'rejected')}
                          disabled={actionLoading === req.id}
                          className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl text-xs sm:text-sm transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {req.status === 'accepted' && (
                    <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                      <button
                        onClick={() => handleRequestDecision(req.id, 'completed')}
                        disabled={actionLoading === req.id}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark as Handed Over / Completed</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Sent Requests */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Track mutual aid requests you have submitted for neighbor supplies
          </p>

          {loading ? (
            <div className="h-36 bg-slate-100 rounded-3xl animate-pulse"></div>
          ) : sentRequests.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
              <Send className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-lg font-bold text-slate-800">You haven't requested any resources yet</h4>
              <p className="text-sm text-slate-500">Browse the Resource Catalog to request needed supplies or shelter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusColors[req.status]}`}>
                        {req.status}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-base">{req.resourceTitle}</h4>
                    </div>
                    <p className="text-sm text-slate-600">
                      Requested {req.requestedQuantity} units from <strong className="text-slate-800">{req.ownerName}</strong>
                    </p>
                    {req.decisionNotes && (
                      <p className="text-sm text-blue-800 font-medium">Owner note: "{req.decisionNotes}"</p>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <button
                      onClick={() => handleRequestDecision(req.id, 'cancelled')}
                      className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold rounded-xl text-xs sm:text-sm transition-colors self-start sm:self-auto shadow-2xs"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: My Emergency Reports */}
      {activeTab === 'emergencies' && (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Incidents and hazards you reported to the community network
          </p>

          {loading ? (
            <div className="h-36 bg-slate-100 rounded-3xl animate-pulse"></div>
          ) : myEmergencies.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-lg font-bold text-slate-800">No emergency reports submitted</h4>
              <p className="text-sm text-slate-500">If you encounter local hazards, click "Report Emergency" anytime.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myEmergencies.map((emg) => (
                <div
                  key={emg.id}
                  onClick={() => onSelectIncident(emg)}
                  className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:border-rose-300 card-hover cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-100 text-rose-900">
                        {emg.severity}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                        {emg.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(emg.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">{emg.title}</h4>
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{emg.description}</p>

                  <div className="pt-2 flex items-center justify-between text-xs sm:text-sm text-slate-500 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {emg.location}
                    </span>
                    {emg.assignedToName && (
                      <span className="text-emerald-700 font-bold">
                        Responder: {emg.assignedToName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
