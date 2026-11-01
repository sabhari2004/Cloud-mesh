import React from 'react';
import { ShieldCheck, Cross, User } from 'lucide-react';

export const RoleBadge = ({ role = 'user', size = 'sm' }) => {
  const configs = {
    admin: {
      label: 'Admin',
      icon: ShieldCheck,
      classes: 'bg-purple-100/90 text-purple-900 border-purple-300/80 font-bold',
    },
    responder: {
      label: 'First Responder',
      icon: Cross,
      classes: 'bg-rose-100/90 text-rose-900 border-rose-300/80 font-bold',
    },
    user: {
      label: 'Community Member',
      icon: User,
      classes: 'bg-slate-100 text-slate-800 border-slate-300/80 font-semibold',
    },
  };

  const current = configs[role] || configs.user;
  const Icon = current.icon;

  const sizeClasses = size === 'xs'
    ? 'text-xs px-2.5 py-0.5 gap-1'
    : size === 'lg'
    ? 'text-sm px-3.5 py-1.5 gap-2'
    : 'text-xs px-3 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs transition-all ${current.classes} ${sizeClasses}`}
    >
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{current.label}</span>
    </span>
  );
};
