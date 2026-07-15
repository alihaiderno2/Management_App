'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('pending');
      return;
    }

    const verifyToken = async () => {
      setStatus('verifying');
      try {
        await apiClient.get(`/auth/verify-email?token=${token}`);
        setStatus('success');

        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err?.response?.data?.message ?? 'The verification link is invalid or has expired.');
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 font-sans" style={{ backgroundColor: '#14161A' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/40 text-center" style={{ backgroundColor: '#FFFFFF' }}>
        
        {status === 'pending' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F4]">
              <svg className="h-6 w-6 text-[#1B1D1F]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#1B1D1F] mb-2">Check your email</h1>
            <p className="text-sm text-[#6B6F76] mb-6">
              We've sent a verification link to your inbox. Please click the link to verify your account.
            </p>
            <button 
              onClick={() => router.push('/login')}
              className="w-full rounded-lg border border-[#E4E4E1] bg-white hover:bg-[#F5F5F4] text-[#1B1D1F] text-sm font-medium py-2.5 transition-colors"
            >
              Back to log in
            </button>
          </>
        )}

        {status === 'verifying' && (
          <>
             <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#1B1D1F]"></div>
             </div>
             <h1 className="text-xl font-semibold text-[#1B1D1F] mb-2">Verifying...</h1>
             <p className="text-sm text-[#6B6F76]">Please wait while we confirm your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F4F1]">
              <svg className="h-6 w-6 text-[#0F7B6C]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#1B1D1F] mb-2">Email Verified!</h1>
            <p className="text-sm text-[#6B6F76] mb-6">
              Your account has been successfully verified. Redirecting you to login...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FCE8E6]">
              <svg className="h-6 w-6 text-[#C1443A]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#1B1D1F] mb-2">Verification Failed</h1>
            <p className="text-sm text-[#6B6F76] mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push('/register')}
              className="w-full rounded-lg bg-[#1B1D1F] hover:bg-[#111214] text-white text-sm font-medium py-2.5 transition-colors"
            >
              Sign up again
            </button>
          </>
        )}

      </div>
    </main>
  );
}

// Wrapping in Suspense is required by Next.js when using useSearchParams in a client component
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex bg-[#14161A]"></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}