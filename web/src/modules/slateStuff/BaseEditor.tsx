import React from 'react';
import { Descendant, Editor, Node, NodeEntry, Text } from 'slate';
import { Editable, ReactEditor, Slate } from 'slate-react';
import { parseText } from './parseText';
import { useRenderElement } from './RenderElement';
import { useRenderLeaf } from './RenderLeaf';
import { getLength } from './utils';

interface BaseEditorProps {
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onChange?: ((value: Descendant[]) => void) | undefined;
  editor: ReactEditor;
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      {
        text: '',
      },
    ],
  },
];
export const serialize = (nodes: Node[]): string => {
  return nodes
    .map((node) => {
      if (Text.isText(node)) {
        return node.text || '';
      }

      const children = serialize(node.children);

      if (!Editor.isEditor(node)) {
        switch (node.type) {
          case 'paragraph':
            return children;
          case 'mention':
            return `@${node.username}#${node.userId}`;
          case 'emoji':
            return `:${node.name}:`;
          default:
            return children;
        }
      }

      return '';
    })
    .join('');
};

export const BaseEditor: React.FC<BaseEditorProps> = ({
  onKeyDown,
  onChange,
  editor,
}) => {
  const renderLeaf = useRenderLeaf();
  const renderElement = useRenderElement();
  const decorate = React.useCallback(([node, path]: NodeEntry<Node>) => {
    const ranges: Array<{ [K: string]: boolean; anchor: any; focus: any }> = [];

    if (!Text.isText(node)) {
      return ranges;
    }

    const tokens = parseText(node.text);

    let start = 0;
    for (const token of tokens) {
      const length = getLength(token as any);
      const end = start + length;

      if (typeof token !== 'string') {
        ranges.push({
          [token.type as any]: true,
          anchor: { path, offset: start },
          focus: { path, offset: end },
        } as any);
      }

      start = end;
    }

    return ranges;
  }, []);

  return (
    <Slate editor={editor} value={initialValue} onChange={onChange}>
      <Editable
        placeholder='Enter your message...'
        spellCheck={false}
        renderPlaceholder={({ attributes, children }) => {
          return <div {...attributes}>{children}</div>;
        }}
        className='px-1 py-1 leading-6 flex-1 break-all'
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        decorate={decorate}
        onKeyDown={onKeyDown}
      />
    </Slate>
  );
};
