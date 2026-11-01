import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  ShieldAlert,
  Package,
  Activity,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  FileText,
  UserCheck,
  Loader2,
  Phone,
  MapPin,
  ExternalLink,
  HandHeart
} from 'lucide-react';
import { userService } from '../services/userService';
import { emergencyService } from '../services/emergencyService';
import { resourceService } from '../services/resourceService';
import { requestService } from '../services/requestService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { RoleBadge } from '../components/RoleBadge';

export const AdminPage = ({ onSelectIncident }) => {
  const { currentUser, role, isAdmin, isResponder, quickSwitchRole } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('incidents'); // 'incidents', 'users', 'resources', 'requests'
  const [loading, setLoading] = useState(true);

  // Data
  const [users, setUsers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [requests, setRequests] = useState([]);

  // User search/filter
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Request search/filter
  const [requestSearch, setRequestSearch] = useState('');
  const [requestFilter, setRequestFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, iList, rList, reqList] = await Promise.all([
        isAdmin ? userService.getAllUsers() : Promise.resolve([]),
        emergencyService.getEmergencyReports({ status: 'all' }),
        resourceService.getResources({ limitCount: 100 }),
        requestService.getAllRequests({ status: 'all' }),
      ]);
      setUsers(uList);
      setIncidents(iList);
      setResources(rList);
      setRequests(reqList || []);
    } catch (err) {
      console.warn('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin, isResponder]);

  if (!isResponder && !isAdmin) {
    return (
      <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-5 max-w-lg mx-auto my-12 shadow-sm">
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 w-fit mx-auto shadow-2xs">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Restricted Command Center</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          This portal requires verified First Responder or Municipal Administrator permissions. You are currently logged in as a <strong>Community Member</strong>.
        </p>

        {/* Evaluation Shortcut */}
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Evaluation Role Switcher:
          </div>
          <p className="text-xs text-slate-500">
            Switch persona to test this command console:
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => quickSwitchRole('admin')}
              className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-purple-700 transition-colors shadow-xs"
            >
              👑 Login as Admin
            </button>
            <button
              onClick={() => quickSwitchRole('responder')}
              className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-rose-700 transition-colors shadow-xs"
            >
              🚑 Login as Responder
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateRole = async (targetUid, newRole) => {
    if (!isAdmin) {
      addToast('Only Administrators can modify user roles', 'error');
      return;
    }
    try {
      await userService.updateUserRole(targetUid, newRole);
      addToast(`Updated user role to ${newRole.toUpperCase()}`, 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleUpdateStatus = async (targetUid, newStatus) => {
    if (!isAdmin) {
      addToast('Only Administrators can suspend or activate users', 'error');
      return;
    }
    try {
      await userService.updateUserStatus(targetUid, newStatus);
      addToast(`User status set to ${newStatus.toUpperCase()}`, 'info');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      await requestService.updateRequestStatus(
        requestId,
        newStatus,
        `Status updated by ${currentUser.displayName || 'Administrator'}`,
        currentUser
      );
      addToast(`Request marked as ${newStatus.toUpperCase()}`, 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update request status', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch =
      (u.displayName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
    return matchRole && matchSearch;
  });

  const filteredRequests = requests.filter((req) => {
    const matchStatus = requestFilter === 'all' || req.status === requestFilter;
    const matchSearch =
      (req.resourceTitle || '').toLowerCase().includes(requestSearch.toLowerCase()) ||
      (req.requesterName || '').toLowerCase().includes(requestSearch.toLowerCase()) ||
      (req.ownerName || '').toLowerCase().includes(requestSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in pb-16">
      {/* Top Banner & Persona Badge */}
      <div className="bg-slate-950 text-white p-7 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-2xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Command & Responder Console
                </h1>
                <RoleBadge role={currentUser.role} size="sm" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Incident triage dispatch, community safety coordination, and access governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm self-start sm:self-auto bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800">
            <span className="text-slate-400">Viewing as:</span>
            <strong className="text-amber-400">{currentUser.displayName}</strong>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 pt-2">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Open Incidents</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
              {incidents.filter((i) => ['reported', 'verified', 'assigned', 'in_progress'].includes(i.status)).length}
            </div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Units</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {incidents.filter((i) => i.status === 'assigned' || i.status === 'in_progress').length}
            </div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Aid Requests</span>
            <div className="text-2xl sm:text-3xl font-black text-indigo-400 mt-1">
              {requests.length}
            </div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Supplies</span>
            <div className="text-2xl sm:text-3xl font-black text-blue-400 mt-1">
              {resources.length}
            </div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Community Members</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {users.length || 3}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Clean horizontal scrollable pill bar that never wraps awkwardly */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-200">
        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'incidents'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Incident Triage & Missions ({incidents.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Access & Role Management</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'resources'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Community Inventory Oversight</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HandHeart className="w-4 h-4" />
          <span>Aid Requests Oversight ({requests.length})</span>
        </button>
      </div>

      {/* Tab 1: Incidents Triage Management */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Full incident board. Click any emergency to view field details, assign dispatch, or update operations.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Incident Headline</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Assigned Responder</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((inc) => (
                    <tr
                      key={inc.id}
                      onClick={() => onSelectIncident(inc)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="p-4 whitespace-nowrap">
                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                          inc.severity === 'critical'
                            ? 'bg-rose-100 text-rose-900'
                            : inc.severity === 'high'
                            ? 'bg-orange-100 text-orange-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900 max-w-xs truncate">
                        {inc.title}
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">
                        {inc.location}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                          {inc.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 whitespace-nowrap font-medium">
                        {inc.assignedToName || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800">
                          Manage &rarr;
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Access & Role Management */}
      {activeTab === 'users' && isAdmin && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Grant responder credentials, manage platform permissions, and enforce community moderation
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 w-52 sm:w-64"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700 font-semibold"
              >
                <option value="all">All Roles</option>
                <option value="user">Citizens Only</option>
                <option value="responder">Responders</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Current Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Change Role Permission</th>
                    <th className="p-4 text-right">Account Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isSelf = u.uid === currentUser.uid || u.id === currentUser.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{u.displayName}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </td>
                        <td className="p-4 text-slate-500">{u.location || 'Not provided'}</td>
                        <td className="p-4">
                          <RoleBadge role={u.role} size="sm" />
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            u.status === 'suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td className="p-4">
                          {isSelf ? (
                            <span className="text-xs text-slate-400 italic font-medium">Current session</span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id || u.uid, e.target.value)}
                              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="user">Citizen Volunteer</option>
                              <option value="responder">First Responder</option>
                              <option value="admin">Administrator</option>
                            </select>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {!isSelf && (
                            <div>
                              {u.status === 'suspended' ? (
                                <button
                                  onClick={() => handleUpdateStatus(u.id || u.uid, 'active')}
                                  className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
                                >
                                  Activate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus(u.id || u.uid, 'suspended')}
                                  className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
                                >
                                  Suspend
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Resource Inventory Oversight */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            System overview of community mutual aid inventory across all neighborhoods
          </p>

          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Category</th>
                    <th className="p-4">Resource Title</th>
                    <th className="p-4">Quantity Available</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Owner</th>
                    <th className="p-4">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 uppercase font-bold text-xs text-blue-700">
                        {r.category}
                      </td>
                      <td className="p-4 font-bold text-slate-900">{r.title}</td>
                      <td className="p-4 text-slate-800 font-semibold">
                        {r.quantity} {r.unit}
                      </td>
                      <td className="p-4 text-slate-500">{r.location}</td>
                      <td className="p-4 text-slate-700 font-medium">{r.ownerName}</td>
                      <td className="p-4">
                        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                          {r.availability}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Resource Requests Oversight */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Platform-wide log of resource exchange requests, counterparty allocations, and delivery fulfillments
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  placeholder="Filter requests..."
                  className="pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52 sm:w-64"
                />
              </div>

              <select
                value={requestFilter}
                onChange={(e) => setRequestFilter(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-semibold"
              >
                <option value="all">All Request Statuses</option>
                <option value="pending">Pending Decision</option>
                <option value="accepted">Accepted / In Progress</option>
                <option value="completed">Completed / Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 min-w-[750px]">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Resource</th>
                    <th className="p-4">Requester</th>
                    <th className="p-4">Resource Provider</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Needed By</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-10 text-center text-slate-400 text-sm">
                        No resource requests match your selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const statusColor = {
                        pending: 'bg-amber-100 text-amber-900 border-amber-300',
                        accepted: 'bg-blue-100 text-blue-900 border-blue-300',
                        completed: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                        cancelled: 'bg-slate-100 text-slate-700 border-slate-300',
                        rejected: 'bg-rose-100 text-rose-900 border-rose-300',
                      }[req.status] || 'bg-slate-100 text-slate-800 border-slate-200';

                      return (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{req.resourceTitle}</div>
                            <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">
                              {req.resourceCategory}
                            </span>
                            {req.notes && (
                              <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">
                                "{req.notes}"
                              </p>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{req.requesterName}</div>
                            {req.requesterContact && (
                              <div className="text-xs text-slate-400 font-medium">{req.requesterContact}</div>
                            )}
                          </td>
                          <td className="p-4 text-slate-800 font-medium">
                            {req.ownerName}
                          </td>
                          <td className="p-4 font-black text-slate-900 text-base">
                            {req.requestedQuantity}
                          </td>
                          <td className="p-4 text-slate-500 text-xs font-medium">
                            {req.neededByDate || 'Flexible'}
                          </td>
                          <td className="p-4">
                            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusColor}`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {isAdmin && (
                              <div className="flex items-center justify-end gap-2">
                                {req.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateRequestStatus(req.id, 'accepted')}
                                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-xs transition-colors border border-emerald-200"
                                      title="Approve Request"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors border border-rose-200"
                                      title="Decline Request"
                                    >
                                      Decline
                                    </button>
                                  </>
                                )}
                                {req.status === 'accepted' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateRequestStatus(req.id, 'completed')}
                                      className="px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-xl text-xs transition-colors shadow-xs"
                                      title="Mark Handover Complete"
                                    >
                                      Complete
                                    </button>
                                    <button
                                      onClick={() => handleUpdateRequestStatus(req.id, 'cancelled')}
                                      className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs transition-colors"
                                      title="Cancel Request"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                {['completed', 'cancelled', 'rejected'].includes(req.status) && (
                                  <span className="text-xs text-slate-400 font-semibold italic">
                                    Resolved
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
