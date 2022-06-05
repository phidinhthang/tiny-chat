import create from 'zustand';
import { combine } from 'zustand/middleware';

export const useCommandOptionStore = create(
  combine(
    {
      shrugMessagePresent: false,
      giphyQueryPresent: false,
    },
    (set) => ({
      setShrugMessagePresent: (shrugMessagePresent: boolean) =>
        set({ shrugMessagePresent }),
      setGiphyQueryPresent: (giphyQueryPresent: boolean) =>
        set({ giphyQueryPresent }),
    })
  )
);
