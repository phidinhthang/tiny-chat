import create from 'zustand';
import { combine } from 'zustand/middleware';
import { GifObject } from '../../lib/models';

export const useChatGiphyStore = create(
  combine(
    {
      queriedText: undefined as undefined | string,
      queriedGifs: [] as GifObject[],
      activeGifIndex: undefined as undefined | number,
    },
    (set) => ({
      setQueriedText: (queriedText: undefined | string) => set({ queriedText }),
      setQueriedGifs: (queriedGifs: GifObject[]) => set({ queriedGifs }),
      setActiveGifIndex: (activeGifIndex: undefined | number) =>
        set({ activeGifIndex }),
    })
  )
);
