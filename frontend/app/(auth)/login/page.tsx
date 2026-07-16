'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { validateEmail, validatePassword } from '@/lib/validators';
import { Button } from '@/app/componenets/ui/Button';
import { Input } from '@/app/componenets/ui/Input';

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

      // meResponse.data is the plain user object now — matches auth-store's User type.
      setSession(meResponse.data, accessToken);
      console.log(meResponse.data, accessToken);
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
              {/* <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#E4E4E1] bg-[#F5F5F4] px-3 py-2 text-sm text-[#1B1D1F] placeholder:text-[#9A9CA3] focus:outline-none focus:ring-2 focus:ring-[#0F7B6C] focus:border-[#0F7B6C] transition-colors"
                placeholder="you@example.com"
              /> */}
              {/* export const Input = forwardRef<HTMLInputElement, InputProps>(
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
                 */}
              <Input
              id="email"
              label="Email"
              type ="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="placeholder:text-[#9A9CA3]"

              >
              </Input>
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
                <a href="/reset-password" className="text-xs text-[#0F7B6C] hover:text-[#0C6659]">
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

            <Button variant="primary" type = "submit" disabled={isSubmitting} >
              {isSubmitting ? 'Logging in…' : needsTwoFactor ? 'Verify & log in' : 'Log in'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E4E4E1] flex flex-col gap-2">
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
          Don't have an account?{' '}
          <a href="/register" className="text-[#F5F4F0] hover:text-white font-medium underline">
            Register
          </a>
        </p>
      </div>
    </main>
  );
}