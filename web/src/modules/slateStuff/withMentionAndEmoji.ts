import { Editor, Transforms, Text } from 'slate';
import { CustomElement } from './slate-types';
import { parseText } from './parseText';
import { emojiMap } from '../emojiPicker/emojiData';
import { getLength } from './utils';
import { useUserMapStore } from '../chat/useUserMapStore';

export const withMentionAndEmoji = (editor: Editor) => {
  const { normalizeNode, isVoid } = editor;

  editor.isVoid = (element: CustomElement) =>
    element.type === 'mention' || element.type === 'emoji'
      ? true
      : isVoid(element);
  editor.isInline = (element: CustomElement) =>
    element.type === 'mention' || element.type === 'emoji'
      ? true
      : isVoid(element);

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (Text.isText(node)) {
      const tokens = parseText(node.text);

      let stop = false;
      let start = 0;
      for (const token of tokens) {
        const length = getLength(token as any);
        const end = start + length;

        if (typeof token !== 'string') {
          if ((token.type === 'mention' || token.type === 'emoji') && !stop) {
            if (token.type === 'mention') {
              console.log('toekn ', token);
              console.log('user map ', useUserMapStore.getState());
              const mentionedUser =
                useUserMapStore.getState().userMap[token.userId!];
              if (mentionedUser && mentionedUser.username === token.value) {
                stop = true;
                Transforms.select(editor, {
                  anchor: { path, offset: start },
                  focus: { path, offset: end },
                });
                Transforms.insertNodes(editor, [
                  {
                    type: 'mention',
                    username: token.value,
                    userId: token.userId!,
                    children: [{ text: '' }],
                  },
                  { text: ' ' },
                ]);
              }
            } else if (token.type === 'emoji') {
              if (emojiMap[token.value]) {
                stop = true;
                Transforms.select(editor, {
                  anchor: { path, offset: start },
                  focus: { path, offset: end },
                });
                Transforms.insertNodes(editor, [
                  {
                    type: 'emoji',
                    children: [{ text: '' }],
                    unicode: emojiMap[token.value].unicode,
                    name: token.value,
                  },
                  { text: ' ' },
                ]);
              }
            }
          }
        }

        start = end;
      }
    }
    normalizeNode(entry);
  };

  return editor;
};
