import { Editor, Transforms, Element, Text, Node } from 'slate';
import { ReactEditor } from 'slate-react';
import { serialize } from './BaseEditor';
import { parseCommandOptions } from './parseCommandOptions';
import { useCommandOptionStore } from './useCommandOptionStore';
import { getLength } from './utils';

export const withSlashCommand = (editor: Editor) => {
  const { normalizeNode, isInline } = editor;
  editor.isInline = (element) => {
    if (element.type === 'shrug-message-option') {
      return true;
    } else {
      return isInline(element);
    }
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;
    const serialized = serialize(editor.children);
    Transforms.unwrapNodes(editor, {
      at: [],
      match: (n) => {
        if (
          Element.isElement(n) &&
          n.type === 'shrug-message-option' &&
          serialize(n.children).length === 0
        ) {
          return true;
        }
        return false;
      },
    });

    if (!serialized.startsWith('/shrug')) {
      Transforms.unwrapNodes(editor, {
        at: [],
        match: (n) => {
          if (Element.isElement(n) && n.type === 'shrug-message-option') {
            let text = serialize(n.children);
            Transforms.insertText(editor, text ? `message:${text}` : '', {
              at: [...ReactEditor.findPath(editor, n)],
            });
            return true;
          }
          return false;
        },
      });
    }

    if (Text.isText(node) && serialized.startsWith('/shrug')) {
      const tokens = parseCommandOptions(node.text, 'shrug', {
        shrugMessage: useCommandOptionStore.getState().shrugMessagePresent,
      });

      let stop = false;
      let start = 0;

      for (const token of tokens) {
        const length = getLength(token);
        const end = start + length;

        if (typeof token !== 'string' && typeof token !== 'undefined') {
          if (!stop && token.type === 'shrug-message') {
            const parentNode = Node.parent(editor, path);
            if (
              Element.isElement(parentNode) &&
              parentNode.type !== 'shrug-message-option' &&
              !useCommandOptionStore.getState().shrugMessagePresent
            ) {
              Transforms.select(editor, {
                anchor: { path, offset: start },
                focus: { path, offset: end },
              });
              Transforms.insertNodes(editor, [
                {
                  type: 'shrug-message-option',
                  children: [{ text: token.value.trim() || ' ' }],
                },
                { text: ' ' },
              ]);

              let container = editor.children[0];
              if (
                Element.isElement(container) &&
                container.type === 'paragraph'
              ) {
                container.children.forEach((node, index) => {
                  if (
                    Element.isElement(node) &&
                    node.type === 'shrug-message-option'
                  ) {
                    const text = Editor.string(editor, {
                      path: [0, index],
                      offset: 0,
                    });
                    Transforms.select(editor, {
                      path: [0, index],
                      offset: text.length,
                    });
                  }
                });
              }
              useCommandOptionStore.getState().setShrugMessagePresent(true);
              stop = true;
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
