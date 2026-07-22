import { create } from 'zustand';

interface User {
    id: string;
    name: string;
    email: string;
    twoFAEnabled: boolean;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setSession: (user: User, accessToken: string) => void;
    setAccessToken: (accessToken: string) => void;
    clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isTwoFactorEnabled: false,
    setSession: (user, accessToken) => set({ user, accessToken, isAuthenticated: true}),
    setAccessToken: (accessToken) => set({ accessToken }),
    clearSession: () => set({ user: null, accessToken: null, isAuthenticated: false}),
}));