import React, { FunctionComponent, memo } from 'react';
import { Emoji } from './Emoji';
import { EmojiObject } from './utils';

export const PickerFooter: FunctionComponent<{
  emoji: EmojiObject | undefined;
  emojiPreviewName: any;
  [key: string]: any;
}> = memo(({ emoji, emojiPreviewName, ...props }) => {
  return (
    <div className='emoji-picker-footer' {...props}>
      {<Emoji emoji={emoji || { name: 'wave', unicode: '1f44b' }} />}
      <div className='emoji-picker-name'>
        {emoji ? (
          emojiPreviewName(emoji)
        ) : (
          <span style={{ fontSize: '1.25em' }}>Emoji Picker</span>
        )}
      </div>
    </div>
  );
});
