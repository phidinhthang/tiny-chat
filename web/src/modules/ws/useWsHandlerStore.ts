import create from 'zustand';
import { combine } from 'zustand/middleware';

export const useWsHandlerStore = create(
  combine({ handlerMap: {} as Record<string, (d: any) => void> }, (set) => ({
    addListener: (op: string, fn: (d: any) => void) => {
      set((s) => ({
        handlerMap: {
          ...s.handlerMap,
          [op]: fn,
        },
      }));
      return () => {
        set((s) => {
          const { [op]: _, ...handlerMap } = s.handlerMap;
          return { handlerMap };
        });
      };
    },
  }))
);
