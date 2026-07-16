import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    return (
      <div>
        <label
          htmlFor={id}
          className="block font-mono text-[11px] tracking-wide text-[#6B6F76] uppercase mb-1.5"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-lg border border-[#E4E4E1] bg-[#F5F5F4] px-3 py-2 text-sm text-[#1B1D1F] placeholder:text-[#9A9CA3] focus:outline-none focus:ring-2 focus:ring-[#0F7B6C] focus:border-[#0F7B6C] transition-colors ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[#C1443A]">{error}</p>}
        {!error && hint && <p className="mt-1 text-xs text-[#6B6F76]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';