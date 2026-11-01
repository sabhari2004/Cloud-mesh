import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, CheckCheck, Clock, ExternalLink, ShieldAlert, Sparkles, Inbox } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export const NotificationDropdown = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const userId = currentUser?.uid || currentUser?.id;

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    const unsubscribe = notificationService.subscribeToNotifications(userId, (list) => {
      setNotifications(list);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [userId]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await notificationService.markAllAsRead(userId);
    addToast('All notifications marked as read', 'info');
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await notificationService.markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link && onNavigate) {
      onNavigate(notif.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-[1.25rem] h-5 px-1 items-center justify-center rounded-full bg-rose-600 text-xs font-extrabold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                    !notif.read ? 'bg-blue-50/60' : ''
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {notif.type === 'emergency_alert' ? (
                      <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    ) : notif.type === 'request_received' || notif.type === 'request_update' ? (
                      <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                        <Bell className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm font-bold truncate ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title="Mark as read"
                          className="text-slate-400 hover:text-blue-600 p-0.5 shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {notif.link && (
                        <span className="text-blue-600 ml-auto flex items-center gap-0.5 font-semibold hover:underline">
                          View details <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
