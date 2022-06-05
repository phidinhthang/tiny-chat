import create from 'zustand';
import { combine } from 'zustand/middleware';
import { BaseUser } from '../../lib/models';

export const useUserMapStore = create(
  combine(
    {
      userMap: {} as Record<string, BaseUser>,
    },
    (set) => ({
      setUserMap: (userMap: Record<string, BaseUser>) => set({ userMap }),
    })
  )
);
