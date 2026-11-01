import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Package,
  MapPin,
  Calendar,
  HandHeart,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { resourceService } from '../services/resourceService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const ResourcesPage = ({
  onOpenOfferModal,
  onOpenRequestModal,
  onEditResource
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [urgentOnly, setUrgentOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await resourceService.getResources({
        category: categoryFilter,
        availability: availabilityFilter,
        search: searchQuery,
        sortBy,
        limitCount: 100,
      });
      setResources(data);
    } catch (err) {
      console.warn('Error loading resources:', err);
      addToast('Failed to load community resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
    setCurrentPage(1);
  }, [categoryFilter, availabilityFilter, sortBy, searchQuery]);

  const handleDelete = async (id, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove the listing for "${title}"?`)) {
      return;
    }

    try {
      await resourceService.deleteResource(id, currentUser);
      addToast('Listing deleted successfully', 'info');
      loadResources();
    } catch (err) {
      addToast(err.message || 'Failed to delete listing', 'error');
    }
  };

  const filtered = urgentOnly ? resources.filter((r) => r.urgent) : resources;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const currentUserId = currentUser?.uid || currentUser?.id;

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
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Community Resource Exchange
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Lend, share, and request essential supplies across your neighborhood
            </p>
          </div>
        </div>

        <button
          onClick={onOpenOfferModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Offer a Resource
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, description, location…"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="food">🥫 Food & Nutrition</option>
            <option value="water">💧 Clean Water</option>
            <option value="medical">🩹 Medical & First Aid</option>
            <option value="shelter">🏠 Temporary Shelter</option>
            <option value="clothing">👕 Clothing & Blankets</option>
            <option value="equipment">⚡ Tools & Generators</option>
            <option value="transportation">🚚 Transportation</option>
            <option value="other">📦 Other Essentials</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Recently Listed</option>
            <option value="quantity_desc">Highest Quantity</option>
            <option value="expiry">Expiring Soonest</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm">
              <input
                type="checkbox"
                checked={urgentOnly}
                onChange={(e) => setUrgentOnly(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
              />
              <span className="font-semibold text-rose-700">Urgent supplies only</span>
            </label>

            {/* Availability */}
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Availability</option>
              <option value="available">Available Now</option>
              <option value="partially_available">Partially Available</option>
              <option value="reserved">Reserved</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <span className="text-xs font-medium text-slate-500">
            Showing <strong className="text-slate-900">{paginatedItems.length}</strong> of{' '}
            <strong className="text-slate-900">{filtered.length}</strong> listings
          </span>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : paginatedItems.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 w-fit mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No matching resources found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try adjusting your filters or list a new item to help your neighborhood.
          </p>
          <button
            onClick={onOpenOfferModal}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Offer Supplies Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginatedItems.map((resource) => {
            const isOwner = resource.ownerId === currentUserId;
            const canEdit = isOwner || isAdmin;
            const canRequest = !isOwner && (resource.availability === 'available' || resource.availability === 'partially_available');

            return (
              <div
                key={resource.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm card-hover hover:border-blue-300 transition-all flex flex-col p-5 gap-4 group"
              >
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {categoryIcons[resource.category] || '📦'} {resource.category}
                    </span>
                    {resource.urgent && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                        Urgent
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                    resource.availability === 'available'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : resource.availability === 'partially_available'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {resource.availability.replace('_', ' ')}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="flex-1">
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                    {resource.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {resource.description}
                  </p>
                </div>

                {/* Meta */}
                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span className="text-lg font-black text-blue-600">{resource.quantity}</span>
                      <span className="text-xs font-bold uppercase text-slate-400">{resource.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Expires {new Date(resource.expiryDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-medium text-slate-600 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{resource.location}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 truncate mr-2">
                      By <strong className="text-slate-700">{resource.ownerName}</strong>
                    </span>
                    {isOwner && (
                      <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-md shrink-0">
                        Your Listing
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditResource(resource)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(resource.id, resource.title, e)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {canRequest ? (
                    <button
                      onClick={() => onOpenRequestModal(resource)}
                      className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5 hover:-translate-y-0.5"
                    >
                      <HandHeart className="w-3.5 h-3.5" />
                      Request Item
                    </button>
                  ) : (
                    <button
                      disabled
                      className="ml-auto px-4 py-2 bg-slate-100 text-slate-400 font-semibold rounded-xl text-xs cursor-not-allowed"
                    >
                      {isOwner ? 'Your Item' : 'Unavailable'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 py-2 text-sm font-bold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
