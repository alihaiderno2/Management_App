'use client';

import { useUiStore } from '@/store/ui-store';

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string | 'unknown';
  size?: 'sm' | 'md' | 'lg';
  userId?: string;
}

export function Avatar({ name, size = 'md', userId }: AvatarProps) {
  const { openProfile } = useUiStore();

  const sizeClasses = 
    size === 'sm' ? 'w-6 h-6 text-[11px]' : 
    size === 'lg' ? 'w-16 h-16 text-xl' : 
    'w-9 h-9 text-sm';

  const interactiveClasses = userId 
    ? 'cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-[#0F7B6C] transition-all' 
    : '';

  return (
    <div
      onClick={(e) => {
        if (userId) {
          e.stopPropagation();
          openProfile(userId);
        }
      }}
      onPointerDown={(e) => {
        if (userId) e.stopPropagation();
      }}
      className={`rounded-full bg-[#0F7B6C] text-white flex items-center justify-center font-medium shrink-0 ${sizeClasses} ${interactiveClasses}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}