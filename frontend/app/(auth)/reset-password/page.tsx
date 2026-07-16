'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/app/componenets/ui/Button';
import { validateEmail, validateConfirmPassword as validatePassword } from '@/lib/validators';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  //when the password is being updated we are in update mode
  const token = searchParams.get('token');
  const isUpdateMode = !!token;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [fieldError, setFieldError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRequestLink = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    setFieldError('');

    const err = validateEmail(email);
    if (err) {
      setFieldError(err);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setIsSuccess(true); 
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setServerError(message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    setFieldError('');

    const err = validatePassword(password, confirmPassword);
    if (err) {
      setFieldError(err);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', {
        resetToken: token,
        password: password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setServerError(message ?? 'The reset link is invalid or has expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 font-sans" style={{ backgroundColor: '#14161A' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/40" style={{ backgroundColor: '#FFFFFF' }}>

        {!isUpdateMode && isSuccess && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F4]">
              <svg className="h-6 w-6 text-[#1B1D1F]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#1B1D1F] mb-2">Check your email</h1>
            <p className="text-sm text-[#6B6F76] mb-6">
              If an account exists for {email}, we have sent a password reset link.
            </p>
            <Button variant="secondary" onClick={() => router.push('/login')}>
              Return to log in
            </Button>
          </div>
        )}

        {!isUpdateMode && !isSuccess && (
          <>
            <h1 className="text-xl font-semibold text-[#1B1D1F] mb-1">Reset password</h1>
            <p className="text-sm text-[#6B6F76] mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleRequestLink} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block font-mono text-[13px] tracking-wide text-[#6B6F76] uppercase mb-1.5">
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
                {fieldError && <p className="mt-1.5 text-xs text-[#C1443A]">{fieldError}</p>}
              </div>

              {serverError && <p className="text-sm text-[#C1443A]">{serverError}</p>}

              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending link...' : 'Send reset link'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[#9A9CA3]">
              Remembered your password?{' '}
              <a href="/login" className="text-[#0F7B6C] hover:text-[#1B1D1F] font-medium underline transition-colors">
                Log in
              </a>
            </p>
          </>
        )}

        {isUpdateMode && isSuccess && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F4F1]">
              <svg className="h-6 w-6 text-[#0F7B6C]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#1B1D1F] mb-2">Password Updated</h1>
            <p className="text-sm text-[#6B6F76] mb-6">
              Your password has been successfully reset. You can now log in with your new credentials.
            </p>
            <Button variant= "primary" onClick={() => router.push('/login')}>
              Go to login
            </Button>
          </div>
        )}

        {isUpdateMode && !isSuccess && (
          <>
            <h1 className="text-xl font-semibold text-[#1B1D1F] mb-1">Set new password</h1>
            <p className="text-sm text-[#6B6F76] mb-6">
              Enter your new password below. Make sure it's at least 8 characters long.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4" noValidate>
              <div>
                <label htmlFor="password" className="block font-mono text-[13px] tracking-wide text-[#6B6F76] uppercase mb-1.5">
                  New Password
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
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block font-mono text-[13px] tracking-wide text-[#6B6F76] uppercase mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#E4E4E1] bg-[#F5F5F4] px-3 py-2 text-sm text-[#1B1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F7B6C] focus:border-[#0F7B6C] transition-colors"
                  placeholder="••••••••"
                />
                {fieldError && <p className="mt-1.5 text-xs text-[#C1443A]">{fieldError}</p>}
              </div>

              {serverError && <p className="text-sm text-[#C1443A]">{serverError}</p>}

              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Reset Password'}
              </Button>
            </form>
          </>
        )}

      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#14161A]"></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}