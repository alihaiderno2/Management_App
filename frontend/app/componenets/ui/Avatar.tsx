function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[11px]' : 'w-9 h-9 text-sm';

  return (
    <div
      className={`rounded-full bg-[#0F7B6C] text-white flex items-center justify-center font-medium flex-shrink-0 ${sizeClasses}`}
    >
      {getInitials(name)}
    </div>
  );
}