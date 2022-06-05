import emojiData from './twemoji.json';

export { emojiData };

type Emoji = {
  name: string;
  unicode: string;
};

export const emojiList = Object.values(emojiData).reduce(
  (acc, group: Emoji[]) => {
    return [...acc, ...group];
  },
  [] as Emoji[]
);

export const emojiSmileysAndEmotionList = emojiData['Smileys & Emotion'];

export const emojiMap = emojiList.reduce((acc, emoji) => {
  acc[emoji.name] = emoji;
  return acc;
}, {} as Record<string, Emoji>);
