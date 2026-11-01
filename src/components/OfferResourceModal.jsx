import React, { useState, useEffect } from 'react';
import { X, Package, MapPin, Calendar, AlertCircle, Phone, Tag, Check, Loader2 } from 'lucide-react';
import { resourceService } from '../services/resourceService';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export const OfferResourceModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('food');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('units');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('available');
  const [contactPreferences, setContactPreferences] = useState('in_app');
  const [contactInfo, setContactInfo] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'food');
      setQuantity(initialData.quantity || 1);
      setUnit(initialData.unit || 'units');
      setLocation(initialData.location || '');
      setAvailability(initialData.availability || 'available');
      setContactPreferences(initialData.contactPreferences || 'in_app');
      setContactInfo(initialData.ownerContact || '');
      setUrgent(Boolean(initialData.urgent));
      setExpiryDate(initialData.expiryDate ? initialData.expiryDate.split('T')[0] : '');
    } else {
      // Defaults
      setTitle('');
      setDescription('');
      setCategory('food');
      setQuantity(1);
      setUnit('units');
      setLocation(currentUser?.location || '');
      setAvailability('available');
      setContactPreferences('in_app');
      setContactInfo(currentUser?.phone || currentUser?.email || '');
      setUrgent(false);
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setExpiryDate(in30Days);
    }
  }, [initialData, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be signed in to list a resource.');
      return;
    }

    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Please fill in all required fields (Title, Description, Location).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title,
        description,
        category,
        quantity: Number(quantity),
        unit,
        location,
        availability,
        contactPreferences,
        contact: contactInfo,
        urgent,
        expiryDate: new Date(expiryDate).toISOString(),
      };

      if (isEdit) {
        await resourceService.updateResource(initialData.id, payload, currentUser);
        addToast('Resource listing updated successfully!', 'success');
      } else {
        await resourceService.createResource(payload, currentUser);
        addToast('Resource listing posted to the community!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save resource listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                {isEdit ? 'Edit Resource Listing' : 'Offer a Community Resource'}
              </h3>
              <p className="text-sm text-slate-500">
                Share supplies, shelter, or equipment with your local neighborhood
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

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 overflow-y-auto space-y-4 pr-1 text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Resource Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 10 Cases Purified Bottled Water, 500W Portable Generator"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Category & Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 capitalize"
              >
                <option value="food">🥫 Food & Nutrition</option>
                <option value="water">💧 Clean Drinking Water</option>
                <option value="medical">🩹 Medical & First Aid</option>
                <option value="shelter">🏠 Temporary Shelter</option>
                <option value="clothing">👕 Clothing & Blankets</option>
                <option value="equipment">⚡ Tools & Generators</option>
                <option value="transportation">🚚 Transportation & Vehicles</option>
                <option value="other">📦 Other Essentials</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Current Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 capitalize"
              >
                <option value="available">Available Now</option>
                <option value="partially_available">Partially Available</option>
                <option value="reserved">Reserved / In Transit</option>
                <option value="unavailable">Currently Unavailable</option>
              </select>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Quantity Available</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Unit of Measure</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. cases, kits, boxes, beds"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Location / Pickup Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Westside Community Center, 42 Elm St, Ward 2"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description & Specifications <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="3"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State condition, shelf life, dimensions, pickup instructions, or special handling..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed font-medium text-slate-900 placeholder:text-slate-400"
            ></textarea>
          </div>

          {/* Expiry Date & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Available Until / Expiry</label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-full p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center gap-3 cursor-pointer select-none hover:bg-rose-50 transition-colors">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="w-5 h-5 text-rose-600 rounded-md focus:ring-rose-500 border-rose-300"
                />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-800">
                    High Priority Dispatch
                  </div>
                  <div className="text-xs text-rose-600 font-medium">Flag for urgent emergency deployment</div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save Changes' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
