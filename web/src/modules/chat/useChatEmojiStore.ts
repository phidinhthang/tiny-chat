import create from 'zustand';
import { combine } from 'zustand/middleware';

type Emoji = {
  name: string;
  unicode: string;
};

export const useChatEmojiStore = create(
  combine(
    {
      queriedEmojis: [] as Emoji[],
      activeEmojiIndex: undefined as number | undefined,
    },
    (set) => ({
      setQueriedEmojis: (queriedEmojis: Emoji[]) => set({ queriedEmojis }),
      setActiveEmojiIndex: (activeEmojiIndex: number | undefined) =>
        set({ activeEmojiIndex }),
    })
  )
);
