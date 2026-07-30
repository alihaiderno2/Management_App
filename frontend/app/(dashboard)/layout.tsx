"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, IconButton, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/app/componenets/layout/Sidebar';
import { useUiStore } from '@/store/ui-store';
import { UserProfileDrawer } from '@/app/componenets/profile/UserProfileDrawer';
import { useChatStore } from '@/store/chat-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { accessToken, isAuthenticated, setSession, clearSession } = useAuthStore();
    const {connectSocket, disconnectSocket} = useChatStore();
    const [isChecking, setIsChecking] = useState(true);

    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    useEffect(() => {
        if (isAuthenticated && accessToken) {
            setIsChecking(false);
            return;
        }

        const tryRestoreSession = async () => {
            try {
                const refreshResponse = await apiClient.post('/auth/refresh');
                const { accessToken: newAccessToken } = refreshResponse.data;
                const meResponse = await apiClient.get('/user/me', {
                    headers: { Authorization: `Bearer ${newAccessToken}` },
                });
                setSession(meResponse.data, newAccessToken);
            } catch {
                clearSession();
                router.push('/login');
            } finally {
                setIsChecking(false);
            }
        };

        tryRestoreSession();
    }, [isAuthenticated, accessToken, setSession, clearSession, router]);

    useEffect(() => {
        if (isAuthenticated && accessToken) {
            connectSocket();
        }

        return () => {
            disconnectSocket();
        };
    }, [isAuthenticated, accessToken, connectSocket, disconnectSocket]);


    if (isChecking) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#14161A' }}>
                <Box sx={{ width: 32, height: 32, border: '2px solid white', borderBottomColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />

            <Box component="main" sx={{ flex: 1, bgcolor: '#F5F5F4', display: 'flex', flexDirection: 'column', width: { md: `calc(100% - 240px)` } }}>

                <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', p: 2, bgcolor: '#14161A', color: '#F5F4F0' }}>
                    <IconButton color="inherit" edge="start" onClick={handleDrawerToggle}>
                        <MenuIcon />
                    </IconButton>
                    <Typography sx={{ ml: 2, fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Menu
                    </Typography>
                </Box>

                <Box sx={{ flex: 1, p: { xs: 2, md: 5 } }}>
                    {children}
                </Box>
            </Box>
            <UserProfileDrawer />
        </Box>
    );
}