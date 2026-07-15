'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

function validateName(name: string): string {
  if (!name.trim()) return 'Name is required';
  return '';
}

function validateEmail(email: string): string {
  if (!email) return 'Email is required';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return 'Enter a valid email';
  return '';
}

function validatePassword(password: string): string {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return '';
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    
    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (nameErr || emailErr || passwordErr) return;

    setIsSubmitting(true);
    try {
      const body = { name, email, password };
      await apiClient.post('/auth/register', body);
      router.push('/verify-email');
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setServerError(message ?? 'Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#14161A' }}>
      <div className="w-full max-w-sm">

        <div className="rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/40" style={{ backgroundColor: '#FFFFFF' }}>
          <h1 className="text-xl font-semibold text-[#1B1D1F] mb-1">Create an account</h1>
          <p className="text-sm text-[#6B6F76] mb-5">
            Enter your details below to get started.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            
            <div>
              <label
                htmlFor="name"
                className="block font-mono text-[13px] tracking-wide text-[#6B6F76] uppercase mb-1.5"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#E4E4E1] bg-[#F5F5F4] px-3 py-2 text-sm text-[#1B1D1F] placeholder:text-[#9A9CA3] focus:outline-none focus:ring-2 focus:ring-[#0F7B6C] focus:border-[#0F7B6C] transition-colors"
                placeholder="John Doe"
              />
              {nameError && <p className="mt-1 text-xs text-[#C1443A]">{nameError}</p>}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[13px] tracking-wide text-[#6B6F76] uppercase mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#E4E4E1] bg-[#F5F5F4] px-3 py-2 text-sm text-[#1B1D1F] placeholder:text-[#9A9CA3] focus:outline-none focus:ring-2 focus:ring-[#0F7B6C] focus:border-[#0F7B6C] transition-colors"
                placeholder="you@example.com"
              />
              {emailError && <p className="mt-1 text-xs text-[#C1443A]">{emailError}</p>}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-[13px] tracking-wide text-[#6B6F76] uppercase mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#E4E4E1] bg-[#F5F5F4] px-3 py-2 text-sm text-[#1B1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F7B6C] focus:border-[#0F7B6C] transition-colors"
                placeholder="••••••••"
              />
              {passwordError && <p className="mt-1 text-xs text-[#C1443A]">{passwordError}</p>}
            </div>

            {serverError && <p className="text-sm text-[#C1443A]">{serverError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#1B1D1F] hover:bg-[#111214] text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-3"
            >
              {isSubmitting ? 'Creating account…' : 'Register'}
            </button>
          </form>

          {/* Slightly reduced margin-top here from mt-6 to mt-5 */}
          <div className="mt-5 pt-5 border-t border-[#E4E4E1] flex flex-col gap-2">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
              className="w-full text-center rounded-lg border border-[#1B1D1F] text-sm text-[#1B1D1F] py-2.5 hover:bg-[#F5F5F4] transition-colors flex items-center justify-center gap-2"
            >
              Continue with Google
            </a>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github`}
              className="w-full text-center rounded-lg border border-[#1B1D1F] text-sm text-[#1B1D1F] py-2.5 hover:bg-[#F5F5F4] transition-colors flex items-center justify-center gap-2"
            >
              Continue with GitHub
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#9A9CA3]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#F5F4F0] hover:text-white font-medium underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}