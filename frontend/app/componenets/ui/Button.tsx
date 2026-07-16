import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const variantClasses =
    variant === 'primary'
      ? 'bg-[#1B1D1F] hover:bg-[#111214] text-white'
      : 'bg-white hover:bg-[#F5F5F4] text-[#1B1D1F] border border-[#1B1D1F]';

  return (
    <button
      className={`w-full rounded-lg text-sm font-medium py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}