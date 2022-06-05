import React, { forwardRef } from 'react';
import { emojiSmileysAndEmotionList } from '../emojiPicker/emojiData';

interface AddEmojiButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export const AddEmojiButton = forwardRef<
  HTMLButtonElement,
  AddEmojiButtonProps
>(({ onClick }, ref) => {
  const [emojiIndex, setEmojijIndex] = React.useState(0);
  return (
    <button
      className={`rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer transition-all grayscale hover:scale-125 hover:grayscale-0`}
      onClick={onClick}
      ref={ref}
      onMouseEnter={() => {
        setEmojijIndex(
          Math.round(Math.random() * emojiSmileysAndEmotionList.length)
        );
      }}
    >
      <img
        className='w-5 h-5'
        src={`/twemoji.svg#${emojiSmileysAndEmotionList[emojiIndex].unicode}`}
      />
    </button>
  );
});
