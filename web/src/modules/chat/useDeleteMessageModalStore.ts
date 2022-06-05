import create from 'zustand';
import { combine } from 'zustand/middleware';
import { Message } from '../../lib/models';

export const useDeleteMessageModalStore = create(
  combine(
    {
      message: null as null | Message,
    },
    (set) => ({
      setMessage: (message: null | Message) =>
        set({
          message,
        }),
    })
  )
);
