"use client";

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {apiClient} from '@/lib/api-client';
import {useAuthStore} from '@/store/auth-store';

export default function DashboardLayout({children} : {children: React.ReactNode}) {
    const router = useRouter();
    const {user,accessToken,isAuthenticated, setSession, clearSession} = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);
    
    useEffect(() =>{
        if(isAuthenticated && accessToken){
            setIsChecking(false);
            return;
        }

        const tryRestoreSession = async () => {
            try{
                const refreshResponse = await apiClient.post('/auth/refresh');
                const {accessToken: newAccessToken} = refreshResponse.data;

                const meResponse = await apiClient.get('/user/me', {
                    headers: {Authorization: `Bearer ${newAccessToken}`},
                });
                // meResponse.data is now the plain user object directly — no .safeUser,
                // and newAccessToken is already the string we need, no .data.accessToken.
                setSession(meResponse.data, newAccessToken);
                console.log('Session restored:', meResponse.data, newAccessToken);
                console.log(accessToken,user,isAuthenticated);
            }catch(err){
                clearSession();
                router.push('/login');
            }finally{
                setIsChecking(false);
            }
        }

        tryRestoreSession();
    },[isAuthenticated, accessToken, setSession, router]);

    if(isChecking){
        return (
            <main className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#14161A'}}>
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
            </main>
        )
    }

    const handleLogout = async () => {
        try{
            await apiClient.post('/auth/logout', {}, {
                headers: {Authorization: `Bearer ${accessToken}`},
            });
            clearSession();
            router.push('/login');
        }catch(err){
            console.error('Logout failed:', err);
        }
        finally{
            clearSession();
        }
    }
    return(
        <div className = "min-h-screen flex flex-col md:flex-row">
            <aside className = "w-full md:w-1/5 bg-[#14161A] flex flex-col justify-between p-4 border-b md:border-b-0 md:border-r border-white/5">
                <div className="flex flex-row md:flex-col md:gap-8 items-center md:items-stretch">
                    <span className="font-mono text-xs tracking-[0.2em] text-[#F5F4F0] uppercase">
                        Team Collaboration
                    </span>

                    <nav className=" md:flex md:flex-col md:gap-1 md:mt-2">
                        <a href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-[#F5F4F0] hover:bg-white/5 transition-colors">
                        Dashboard
                        </a>
                        <a href="/workspace" className="rounded-lg px-3 py-2 text-sm text-[#9A9CA3] hover:bg-white/5 hover:text-[#F5F4F0] transition-colors">
                        Workspaces
                        </a>
                        <a href="/settings" className="rounded-lg px-3 py-2 text-sm text-[#9A9CA3] hover:bg-white/5 hover:text-[#F5F4F0] transition-colors">
                        Settings
                        </a>
                    </nav>
                </div>

                <div className="hidden md:flex items-center gap-3 md:pt-4 md:mt-4 md:border-t md:border-white/10">
                    <div>
                        <p className="text-sm text-[#F5F4F0]">{user?.name}</p>
                        <p className="text-xs text-[#9A9CA3]">{user?.email}</p>
                    </div>
                    <button onClick={handleLogout} className="text-xs text-[#9A9CA3] hover:text-[#F5F4F0] transition-colors">
                        Log out
                    </button>
                </div>
            </aside>
            <main className = "flex-1 p-4 bg-[#F5F4F0]">
                {children}
            </main>
        </div>
    )
}