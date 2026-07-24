import { create } from 'zustand';

interface UiState {
  selectedProfileId: string | null;
  openProfile: (userId: string) => void;
  closeProfile: () => void;
}

export const useUiStore = create<UiState>((set)=>({
    selectedProfileId: null,
    openProfile: (userId: string) => set({ selectedProfileId: userId }),
    closeProfile: () => set({ selectedProfileId: null }),
}))