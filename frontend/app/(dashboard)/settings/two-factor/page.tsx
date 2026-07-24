'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/app/componenets/ui/Button';
import { Input } from '@/app/componenets/ui/Input';

export default function TwoFactorPage() {
  const { user, accessToken } = useAuthStore();
  const [step, setStep] = useState<'idle' | 'setup' | 'done'>(user?.twoFAEnabled ? 'done' : 'idle');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartSetup = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await apiClient.get('/auth/two-factor/generate', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setQrCodeDataUrl(res.data.qrCodeDataUrl);
      setManualEntryKey(res.data.manualEntryKey ?? '');
      setStep('setup');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not start 2FA setup.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your app.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/two-factor/verify', { code }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data.success === false) {
        setError(res.data.message ?? 'Invalid code.');
        return;
      }
      setStep('done');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-[#1B1D1F] mb-6">Two-factor authentication</h1>

      <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF' }}>
        {step === 'done' && (
          <div>
            <p className="text-sm text-[#0F7B6C] font-medium mb-1">✓ Enabled</p>
            <p className="text-sm text-[#6B6F76]">Your account is protected with two-factor authentication.</p>
          </div>
        )}

        {step === 'idle' && (
          <div>
            <p className="text-sm text-[#6B6F76] mb-4">
              Add an extra layer of security — you'll need a code from an authenticator app every time you log in.
            </p>
            <Button variant="primary" onClick={handleStartSetup} disabled={isLoading}>
              {isLoading ? 'Starting…' : 'Set up two-factor authentication'}
            </Button>
            {error && <p className="text-sm text-[#C1443A] mt-2">{error}</p>}
          </div>
        )}

        {step === 'setup' && (
          <div>
            <p className="text-sm text-[#6B6F76] mb-4">Scan this QR code with your authenticator app.</p>
            {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="2FA QR code" className="w-40 h-40 mx-auto mb-4" />}
            {manualEntryKey && (
              <p className="text-xs text-[#9A9CA3] text-center mb-4 break-all">
                Can't scan? Enter this code manually: <br />
                <span className="font-mono text-[#1B1D1F]">{manualEntryKey}</span>
              </p>
            )}
            <Input id="code" label="6-digit code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="tracking-widest text-center mb-4" />
            {error && <p className="text-sm text-[#C1443A] mb-3">{error}</p>}
            <Button variant="primary" onClick={handleVerify} disabled={isLoading}>
              {isLoading ? 'Verifying…' : 'Verify & enable'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}