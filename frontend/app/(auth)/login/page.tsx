'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

function validateEmail(email: string): string {
  if (!email) return 'Email is required';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return 'Enter a valid email';
  return '';
}

function validatePassword(password: string): string {
  if (!password) return 'Password is required';
  return '';
}

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFACode, setTwoFACode] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');

  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) return;

    setIsSubmitting(true);
    try {
      const body: { email: string; password: string; twoFACode?: string } = { email, password };
      if (needsTwoFactor) body.twoFACode = twoFACode;

      const response = await apiClient.post('/auth/login', body);
      const { accessToken } = response.data;

      const meResponse = await apiClient.get('/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setSession(meResponse.data, accessToken);
      router.push('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message;
      if (message === 'Two Factor Authentication code is required') {
        setNeedsTwoFactor(true);
      } else {
        setServerError(message ?? 'Something went wrong. Try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#14161A' }}>
      <div className="w-full max-w-sm">

        <div className="rounded-2xl p-8 shadow-xl shadow-black/40" style={{ backgroundColor: '#FFFFFF' }}>
          <h1 className="text-xl font-semibold text-[#1B1D1F] mb-1">Log in</h1>
          <p className="text-sm text-[#6B6F76] mb-6">
            Welcome back — enter your details below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block font-mono text-[13px] tracking-wide text-[#6B6F76] uppercase"
                >
                  Password
                </label>
                <a href="/forgot-password" className="text-xs text-[#0F7B6C] hover:text-[#0C6659]">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#E4E4E1] bg-[#F5F5F4] px-3 py-2 text-sm text-[#1B1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F7B6C] focus:border-[#0F7B6C] transition-colors"
              />
              {passwordError && <p className="mt-1 text-xs text-[#C1443A]">{passwordError}</p>}
            </div>

            {needsTwoFactor && (
              <div>
                <label
                  htmlFor="twoFACode"
                  className="block font-mono text-[13px] tracking-wide text-[#6B6F76] uppercase mb-1.5"
                >
                  2FA code
                </label>
                <input
                  id="twoFACode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value)}
                  className="w-full rounded-lg border border-[#E4E4E1] bg-[#F5F5F4] px-3 py-2 text-sm text-[#1B1D1F] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0F7B6C] focus:border-[#0F7B6C] transition-colors"
                  placeholder="123456"
                />
                <p className="mt-1 text-xs text-[#6B6F76]">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>
            )}

            {serverError && <p className="text-sm text-[#C1443A]">{serverError}</p>}

            {/* #1B1D1F — dark button, on the light card, for contrast */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#1B1D1F] hover:bg-[#111214] text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Logging in…' : needsTwoFactor ? 'Verify & log in' : 'Log in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E4E4E1] flex flex-col gap-2">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
              className="w-full text-center rounded-lg border border-[#1B1D1F] text-sm text-[#1B1D1F] py-2.5 hover:bg-[#F5F5F4] transition-colors"
            >
              Continue with Google
            </a>
            <a
              href={'http://localhost:3001/v1/auth/github' }
              className="w-full text-center rounded-lg border border-[#1B1D1F] text-sm text-[#1B1D1F] py-2.5 hover:bg-[#F5F5F4] transition-colors"
            >
              Continue with GitHub
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#9A9CA3]">
          Don't have an account?{' '}
          <a href="/register" className="text-[#F5F4F0] hover:text-white font-medium underline">
            Register
          </a>
        </p>
      </div>
    </main>
  );
}