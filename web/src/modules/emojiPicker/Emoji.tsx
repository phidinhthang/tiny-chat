import React from 'react';
import { EmojiObject, unifiedToNative } from './utils';

export interface EmojiProps {
  emoji: EmojiObject;
  className?: string;
  [key: string]: any;
}

export const Emoji: React.FC<EmojiProps> = ({ emoji, className, ...props }) => {
  const cn = className
    ? `emoji-picker-emoji ${className}`
    : `emoji-picker-emoji`;

  return (
    <img
      className={cn}
      data-unicode={emoji.unicode}
      alt={unifiedToNative(emoji.unicode)}
      src={`/twemoji.svg#${emoji.unicode}`}
      draggable='false'
      aria-label={emoji.name}
      {...props}
    />
  );
};
