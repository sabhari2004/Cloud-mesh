import React, { useState } from 'react';
import { X, HandHeart, Calendar, AlertCircle, Phone, Package, Loader2 } from 'lucide-react';
import { requestService } from '../services/requestService';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { sanitizeText, sanitizeNumber } from '../utils/sanitize';

export const RequestResourceModal = ({ isOpen, onClose, resource, onSuccess }) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [neededByDate, setNeededByDate] = useState('');
  const [contactInfo, setContactInfo] = useState(currentUser?.phone || currentUser?.email || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !resource) return null;

  const maxQty = resource.quantity || 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be signed in to request resources.');
      return;
    }

    const currentUserId = currentUser.uid || currentUser.id;
    if (resource.ownerId === currentUserId) {
      setError('You cannot request your own resource listing.');
      return;
    }

    if (quantity > maxQty) {
      setError(`Cannot request more than the available quantity (${maxQty} ${resource.unit}).`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await requestService.createRequest({
        resourceId: resource.id,
        resourceTitle: resource.title,
        resourceCategory: resource.category,
        ownerId: resource.ownerId,
        ownerName: resource.ownerName,
        requestedQuantity: sanitizeNumber(quantity, 1, maxQty, 1),
        neededByDate: sanitizeText(neededByDate, 30),
        notes: sanitizeText(notes, 500),
        requesterContact: sanitizeText(contactInfo, 100),
      }, currentUser);

      addToast(`Request for ${quantity} ${resource.unit} submitted to ${resource.ownerName}!`, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
              <HandHeart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">Request Community Resource</h3>
              <p className="text-sm text-slate-500">Connect with the resource owner to arrange direct handover</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Resource Mini Preview */}
        <div className="mt-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200">
              {resource.category}
            </span>
            <h4 className="font-extrabold text-slate-900 text-base">{resource.title}</h4>
            <p className="text-xs text-slate-500 font-medium">
              Listed by <strong className="text-slate-700">{resource.ownerName}</strong> • {resource.location}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-base font-black text-slate-900">{resource.quantity} {resource.unit}</div>
            <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Available Now</div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Request Form */}
        <form onSubmit={handleSubmit} className="mt-4 overflow-y-auto space-y-4 pr-1 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Quantity Needed <span className="text-slate-400">(max {maxQty})</span>
              </label>
              <input
                type="number"
                min="1"
                max={maxQty}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Needed By Date</label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="date"
                  required
                  value={neededByDate}
                  onChange={(e) => setNeededByDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Your Direct Contact Info</label>
            <div className="relative">
              <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Phone number or preferred contact method"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Purpose / Situation Details <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="3"
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain how you will use this resource, pickup capability, or urgent timing..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed font-medium text-slate-900 placeholder:text-slate-400"
            ></textarea>
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
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request to Owner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
