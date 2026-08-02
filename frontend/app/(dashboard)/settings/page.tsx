'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Avatar } from '@/app/componenets/ui/Avatar';
import { Button } from '@/app/componenets/ui/Button';
import { Input } from '@/app/componenets/ui/Input';

export default function SettingsPage() {
  const { user, accessToken, setSession } = useAuthStore();
  
  const [name, setName] = useState(user?.name ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  const [showOnlineStatus, setShowOnlineStatus] = useState(user?.showOnlineStatus ?? true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFAEnabled || false);
  const [setupStep, setSetupStep] = useState<'idle' | 'setup'>('idle');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [code, setCode] = useState('');
  const [error2FA, setError2FA] = useState('');
  const [isLoading2FA, setIsLoading2FA] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim() || name === user?.name) return;
    setIsSavingProfile(true);
    setProfileMessage({ text: '', type: '' });

    try {
      const res = await apiClient.patch('/user/profile', { name }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const updatedName = res.data?.user?.name || res.data?.name || name;
      
      if (user) setSession({ ...user, name: updatedName }, accessToken!);
      
      setProfileMessage({ text: 'Profile updated successfully.', type: 'success' });
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setProfileMessage({ text: 'Failed to update profile.', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleOnlineStatus = async () => {
    setIsUpdatingStatus(true);
    const newStatus = !showOnlineStatus;
    
    try {
      const res = await apiClient.patch('/user/profile', { showOnlineStatus: newStatus }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setShowOnlineStatus(newStatus);
      if (user) setSession({ ...user, showOnlineStatus: newStatus }, accessToken!);
    } catch (err) {
      console.error('Failed to update online status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleToggle2FA = async () => {
    setError2FA('');
    
    if (is2FAEnabled) {
      setIsLoading2FA(true);
      try {
        await apiClient.post('/auth/two-factor/disable', {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setIs2FAEnabled(false);
        setSetupStep('idle');
        if (user) setSession({ ...user, twoFAEnabled: false }, accessToken!);
      } catch (err: any) {
        setError2FA(err?.response?.data?.message ?? 'Failed to disable 2FA.');
      } finally {
        setIsLoading2FA(false);
      }
      return;
    }

    if (setupStep === 'idle') {
      setIsLoading2FA(true);
      try {
        const res = await apiClient.get('/auth/two-factor/generate', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setQrCodeDataUrl(res.data.qrCodeDataUrl);
        setManualEntryKey(res.data.manualEntryKey ?? '');
        setSetupStep('setup');
      } catch (err: any) {
        setError2FA(err?.response?.data?.message ?? 'Could not start 2FA setup.');
      } finally {
        setIsLoading2FA(false);
      }
    } else {
      setSetupStep('idle');
      setCode('');
    }
  };

  const handleVerify2FA = async () => {
    setError2FA('');
    if (code.length !== 6) {
      setError2FA('Enter the 6-digit code from your app.');
      return;
    }
    
    setIsLoading2FA(true);
    try {
      const res = await apiClient.post('/auth/two-factor/verify', { code }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (res.data.success === false) {
        setError2FA(res.data.message ?? 'Invalid code.');
        return;
      }
      
      setIs2FAEnabled(true);
      setSetupStep('idle');
      if (user) setSession({ ...user, twoFAEnabled: true }, accessToken!);
    } catch (err: any) {
      setError2FA(err?.response?.data?.message ?? 'Invalid code.');
    } finally {
      setIsLoading2FA(false);
    }
  };

  return (
    <div className="max-w-3xl pb-12">
      <h1 className="text-2xl font-semibold text-[#1B1D1F] mb-6">Settings</h1>

      <div className="rounded-2xl p-6 mb-4 bg-white">
        <h2 className="text-sm font-semibold text-[#1B1D1F] mb-6 uppercase tracking-wider">Public Profile</h2>
        <div className="flex flex-col md:flex-row items-start gap-8">
          <Avatar name={user?.name ?? ''} size="lg" userId={user?.id} />
          <div className="flex-1 w-full max-w-md">
            <div className="mb-4">
              <Input 
                id="name"
                label="Full Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
            <div className="mb-4">
              <Input 
                id="email"
                label="Email Address" 
                value={user?.email || ''} 
                disabled 
                className="bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-[#9A9CA3] mt-1.5">Email address cannot be changed.</p>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <Button 
                variant="primary" 
                onClick={handleSaveProfile} 
                disabled={isSavingProfile || name === user?.name || !name.trim()}
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-6 mb-4 bg-white">
        <h2 className="text-sm font-semibold text-[#1B1D1F] mb-6 uppercase tracking-wider">Privacy</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#1B1D1F]">Show online status</p>
            <p className="text-xs text-[#9A9CA3] mt-1">
              Let your team know when you are active in the workspace.
            </p>
          </div>
          
          <button
            type="button"
            className={`${
              showOnlineStatus ? 'bg-[#0F7B6C]' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
            onClick={handleToggleOnlineStatus}
            disabled={isUpdatingStatus}
          >
            <span
              className={`${
                showOnlineStatus ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-white">
        <h2 className="text-sm font-semibold text-[#1B1D1F] mb-6 uppercase tracking-wider">Security</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#1B1D1F]">Two-factor authentication</p>
            <p className="text-xs text-[#9A9CA3] mt-1">
              Add an extra layer of security to your account.
            </p>
          </div>
          
          <button
            type="button"
            className={`${
              is2FAEnabled || setupStep === 'setup' ? 'bg-[#0F7B6C]' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
            onClick={handleToggle2FA}
            disabled={isLoading2FA}
          >
            <span
              className={`${
                is2FAEnabled || setupStep === 'setup' ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        {error2FA && setupStep === 'idle' && <p className="text-sm text-[#C1443A] mt-4">{error2FA}</p>}

        {setupStep === 'setup' && (
          <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-[#F9FAFB] border border-gray-100 rounded-xl p-6 flex flex-col md:flex-row gap-8 items-start">
              
              <div className="flex flex-col items-center w-full md:w-auto">
                <p className="text-sm font-medium text-[#1B1D1F] mb-3 text-center md:text-left w-full">1. Scan QR Code</p>
                {qrCodeDataUrl && (
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                    <img src={qrCodeDataUrl} alt="2FA QR code" className="w-36 h-36" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 w-full max-w-sm">
                {manualEntryKey && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-[#1B1D1F] mb-2">Can't scan the code?</p>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-[#6B6F76] mb-1">Enter this key manually:</p>
                      <p className="font-mono text-[#1B1D1F] font-semibold text-sm break-all">{manualEntryKey}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-[#1B1D1F] mb-3">2. Enter 6-digit code</p>
                  <div className="flex flex-col gap-3">
                    <Input 
                      id="code"
                      label="Authenticator Code"
                      inputMode="numeric" 
                      maxLength={6} 
                      value={code} 
                      onChange={(e) => setCode(e.target.value)} 
                      placeholder="123456" 
                      className="tracking-[0.5em] text-center font-mono text-lg py-3" 
                    />
                    <Button variant="primary" className="w-full justify-center py-2.5" onClick={handleVerify2FA} disabled={isLoading2FA || code.length !== 6}>
                      {isLoading2FA ? 'Verifying...' : 'Verify & Enable'}
                    </Button>
                  </div>
                  {error2FA && <p className="text-sm text-[#C1443A] mt-2 text-center">{error2FA}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}