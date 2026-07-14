import {create} from 'zustand';

interface User{
    id: string;
    name: string;
    email: string;
}

interface AuthState{
    user: User | null;
    isAuthenticated: boolean;
    setSession: (user: User) => void;
    clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    setSession: (user: User) => set({ user, isAuthenticated: true }),
    clearSession: () => set({ user: null, isAuthenticated: false }),
}))