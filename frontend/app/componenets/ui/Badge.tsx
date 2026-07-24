import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'danger';
}


export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-[#F5F5F4] text-[#6B6F76]',
    accent: 'bg-[#E1F5EE] text-[#0F7B6C]',
    danger: 'bg-[#FCEBEB] text-[#C1443A]',
  }[variant];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses}`}>
      {children}
    </span>
  );
}