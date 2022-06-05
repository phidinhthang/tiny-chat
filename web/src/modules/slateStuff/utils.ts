import { Editor, Range } from 'slate';

type Token = {
  type: string;
  value: Token[] | string;
  raw: Token[] | string;
};

export const getLength = (token: Token | string): number => {
  if (typeof token === 'string') {
    return token.length;
  } else if (typeof token.value === 'string') {
    return token.raw.length;
  } else {
    return token.value?.reduce?.((l, t) => l + getLength(t), 0);
  }
};

export const getMentionOrEmojiBeforeCaret = (
  type: 'mention' | 'emoji',
  editor: Editor
) => {
  const selection = editor.selection;
  if (selection && Range.isCollapsed(selection)) {
    const [start] = Range.edges(selection);
    const wordBefore = Editor.before(editor, start, { unit: 'word' });
    const before = wordBefore && Editor.before(editor, wordBefore);
    const beforeRange = before && Editor.range(editor, before, start);
    const beforeText = beforeRange && Editor.string(editor, beforeRange);
    let regexp: RegExp;
    if (type === 'mention') {
      regexp = /^@(\w+)$/;
    } else {
      regexp = /^:(\w+)$/;
    }
    const beforeMatch = beforeText && beforeText.match(regexp);
    return beforeMatch;
  }

  return null;
};

export const getWordBeforeCaret = (
  editor: Editor,
  terminateByWhitespace?: boolean
) => {
  const selection = editor.selection;
  if (selection && Range.isCollapsed(selection)) {
    const [start] = Range.edges(selection);
    const characterBefore = Editor.before(editor, start, { unit: 'character' });
    const characterRange =
      characterBefore && Editor.range(editor, characterBefore, start);
    const characterText =
      characterRange && Editor.string(editor, characterRange);
    if (characterText === ' ' && terminateByWhitespace) return '';

    const wordBefore = Editor.before(editor, start, { unit: 'word' });
    const wordBeforeRange =
      wordBefore && Editor.range(editor, wordBefore, start);
    const wordBeforeText =
      wordBeforeRange && Editor.string(editor, wordBeforeRange);
    return wordBeforeText;
  }

  return null;
};
