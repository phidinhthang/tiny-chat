import create from 'zustand';
import { combine } from 'zustand/middleware';

export interface SlashCommand {
  name: string;
  description: string;
  options: {
    [key: string]: string;
  };
}

export const slashCommands: SlashCommand[] = [
  {
    name: 'shrug',
    description: 'Appends ¯\\_(ツ)_/¯ to your message.',
    options: {
      message: 'Your message',
    },
  },
  {
    name: 'giphy',
    description: 'Search Animated GIFs on the Web',
    options: {
      query: 'Search for a gif',
    },
  },
];

export const useSlashCommandStore = create(
  combine(
    {
      queriedCommands: [] as SlashCommand[],
      activeCommandIndex: undefined as undefined | number,
    },
    (set) => ({
      setQueriedCommands: (queriedCommands: SlashCommand[]) =>
        set({ queriedCommands }),
      setActiveCommandIndex: (activeCommandIndex: undefined | number) =>
        set({ activeCommandIndex }),
    })
  )
);
