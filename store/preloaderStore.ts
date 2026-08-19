import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreloaderState {
  shown: boolean;
  setShown: (value: boolean) => void;
}

export const usePreloaderStore = create<PreloaderState>()(
  persist(
    (set) => ({
      shown: false,
      setShown: (value) => set({ shown: value }),
    }),
    {
      name: 'vexilon-preloader',
    }
  )
);
