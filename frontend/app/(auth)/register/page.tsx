'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Button } from '@/app/componenets/ui/Button';
import { validateEmail, validatePassword, validateName } from '@/lib/validators';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const queryEmail = searchParams.get('email') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(queryEmail);
  const [password, setPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (queryEmail) setEmail(queryEmail);
  }, [queryEmail]);

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
      if (redirectUrl && redirectUrl !== '/dashboard') {
        router.push(`/verify-email?redirect=${encodeURIComponent(redirectUrl)}`);
      } else {
        router.push('/verify-email');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setServerError(message ?? 'Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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

            <Button variant="primary" type="submit" disabled={isSubmitting} >
              {isSubmitting ? 'Creating account…' : 'Register'}
            </Button>
          </form>

          {/* Slightly reduced margin-top here from mt-6 to mt-5 */}
          <div className="mt-5 pt-5 border-t border-[#E4E4E1] flex flex-col gap-2">
            <Button variant="secondary" onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
            }}>
              Continue with Google
            </Button>
            <Button variant="secondary" onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
            }}>
              Continue with GitHub
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#9A9CA3]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#F5F4F0] hover:text-white font-medium underline">
            Log in
          </Link>
        </p>
      </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#14161A' }}>
      <Suspense fallback={<div className="w-full max-w-sm rounded-2xl p-6 sm:p-8 shadow-xl bg-white min-h-[500px] animate-pulse" />}>
        <RegisterContent />
      </Suspense>
    </main>
  );
}