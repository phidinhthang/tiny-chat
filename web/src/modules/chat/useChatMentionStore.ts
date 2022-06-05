import create from 'zustand';
import { combine } from 'zustand/middleware';
import { BaseUser } from '../../lib/models';

export const useChatMentionStore = create(
  combine(
    {
      queriedUsers: [] as BaseUser[],
      activeMentionIndex: undefined as number | undefined,
    },
    (set) => ({
      setQueriedUsers: (queriedUsers: BaseUser[]) => set({ queriedUsers }),
      setActiveMentionIndex: (activeMentionIndex: number | undefined) =>
        set({ activeMentionIndex }),
    })
  )
);
