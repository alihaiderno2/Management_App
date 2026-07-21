'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '../componenets/ui/Button';

interface InviteDetails {
  email: string;
  role: string;
  workspaceId: string;
  workspaceName: string;
}

function InviteAcceptContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const { isAuthenticated, user, accessToken, clearSession } = useAuthStore();
  const token = searchParams.get('token') ?? '';

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'accepting' | 'done'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailHasAccount, setEmailHasAccount] = useState<boolean | null>(null);

  // Hook 1: Fetch the invite details ONLY ONCE
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('This invite link is missing information.');
      return;
    }

    apiClient
      .get(`/workspace/invite-details/${token}`)
      .then((res) => setInvite(res.data))
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err?.response?.data?.message ?? 'This invite link is invalid or has expired.');
      });
  }, [token]);

  // Hook 2: Evaluate Auth State
  useEffect(() => {
    if (!invite || status === 'error' || status === 'done' || status === 'accepting') return;

    if (isAuthenticated && user) {
      if (user.email.toLowerCase() === invite.email.toLowerCase()) {
        setStatus('accepting');
      } else {
        setStatus('error');
        setErrorMessage(`You are logged in as ${user.email}, but this invite is for ${invite.email}. Please log out.`);
      }
    } else {
      setStatus('ready');
      apiClient
        .get(`/auth/check-email?email=${encodeURIComponent(invite.email)}`)
        .then((checkRes) => setEmailHasAccount(checkRes.data.exists))
        .catch(() => setEmailHasAccount(false)); 
    }
  }, [invite, isAuthenticated, user, status]);

  // Hook 3: Actually accept the invite
  useEffect(() => {
    if (status !== 'accepting' || !invite || !accessToken) return;

    apiClient
      .post(`/workspace/${invite.workspaceId}/invites/${token}/accept`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(() => {
        setStatus('done');
        setTimeout(() => router.push(`/workspace/${invite.workspaceId}`), 1500);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err?.response?.data?.message ?? 'Could not accept this invite.');
      });
  }, [status, invite, accessToken, token, router]);

  // Safely build the redirect URL using Next.js hooks
  const handleAuthRedirect = () => {
    if (!invite) return;
    
    // This perfectly captures `/invite-accept?workspaceId=123&token=abc`
    const currentUrl = `${pathname}?${searchParams.toString()}`;
    const returnUrl = encodeURIComponent(currentUrl);
    const emailParam = encodeURIComponent(invite.email);

    if (emailHasAccount) {
      router.push(`/login?email=${emailParam}&redirect=${returnUrl}`);
    } else {
      router.push(`/register?email=${emailParam}&redirect=${returnUrl}`);
    }
  };
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#14161A' }}>
      <div className="w-full max-w-sm rounded-2xl p-8 shadow-xl" style={{ backgroundColor: '#FFFFFF' }}>

        {status === 'loading' && <p className="text-sm text-[#6B6F76]">Checking your invite…</p>}
        {status === 'accepting' && <p className="text-sm text-[#6B6F76]">Joining the workspace…</p>}
        {status === 'done' && <p className="text-sm text-[#0F7B6C]">You're in! Redirecting…</p>}

        {status === 'error' && (
          <>
            <p className="text-sm text-[#C1443A] mb-4">{errorMessage}</p>
            {errorMessage.includes('log out') ? (
               <Button variant="secondary" onClick={() => {
                 clearSession(); // Matches your store's method
                 window.location.reload();
               }}>
                 Log out
               </Button>
            ) : (
               <Button variant="secondary" onClick={() => router.push('/login')}>
                 Back to log in
               </Button>
            )}
          </>
        )}

        {status === 'ready' && invite && emailHasAccount !== null && (
          <>
            <h1 className="text-lg font-semibold text-[#1B1D1F] mb-1">
              You're invited to {invite.workspaceName}
            </h1>
            <p className="text-sm text-[#6B6F76] mb-6">
              As a <strong>{invite.role}</strong> — {emailHasAccount ? 'log in' : 'create an account'} with{' '}
              <strong>{invite.email}</strong> to accept.
            </p>

            <Button variant="primary" className="w-full" onClick={handleAuthRedirect}>
              {emailHasAccount ? 'Go to Log In' : 'Go to Sign Up'}
            </Button>
          </>
        )}
      </div>
    </main>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: '#14161A' }} />}>
      <InviteAcceptContent />
    </Suspense>
  );
}