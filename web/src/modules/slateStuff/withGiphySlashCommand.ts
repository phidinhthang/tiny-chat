import { Editor, Element, Text, Transforms, Node } from 'slate';
import { ReactEditor } from 'slate-react';
import { serialize } from './BaseEditor';
import { parseCommandOptions } from './parseCommandOptions';
import { useCommandOptionStore } from './useCommandOptionStore';
import { getLength } from './utils';

export const withGiphySlashCommand = (editor: Editor) => {
  const { normalizeNode, isInline } = editor;
  editor.isInline = (element) => {
    if (element.type === 'giphy-query-option') {
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
          n.type === 'giphy-query-option' &&
          serialize(n.children).length === 0
        ) {
          return true;
        }
        return false;
      },
    });

    if (!serialized.startsWith('/giphy')) {
      Transforms.unwrapNodes(editor, {
        at: [],
        match: (n) => {
          if (Element.isElement(n) && n.type === 'giphy-query-option') {
            let text = serialize(n.children);
            Transforms.insertText(editor, text ? `query:${text}` : '', {
              at: [...ReactEditor.findPath(editor, n)],
            });
            return true;
          }
          return false;
        },
      });
    }

    if (Text.isText(node) && serialized.startsWith('/giphy')) {
      const tokens = parseCommandOptions(node.text, 'giphy', {
        giphyQuery: useCommandOptionStore.getState().giphyQueryPresent,
      });

      let stop = false;
      let start = 0;

      for (const token of tokens) {
        const length = getLength(token);
        const end = start + length;

        if (typeof token !== 'string' && typeof token !== 'undefined') {
          if (!stop && token.type === 'giphy-query') {
            const parentNode = Node.parent(editor, path);
            if (
              Element.isElement(parentNode) &&
              parentNode.type !== 'giphy-query-option' &&
              !useCommandOptionStore.getState().giphyQueryPresent
            ) {
              Transforms.select(editor, {
                anchor: { path, offset: start },
                focus: { path, offset: end },
              });
              Transforms.insertNodes(editor, [
                {
                  type: 'giphy-query-option',
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
                    node.type === 'giphy-query-option'
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
              useCommandOptionStore.getState().setGiphyQueryPresent(true);
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
