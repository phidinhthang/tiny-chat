import React from 'react';
import { RenderLeafProps } from 'slate-react';

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.link) {
    return (
      <a {...attributes} href={leaf.text} className='text-blue-500 underline'>
        {children}
      </a>
    );
  }

  let fontSize = 16;
  let bold = false;

  if (
    leaf.h1 ||
    leaf.h2 ||
    leaf.h3 ||
    leaf.h4 ||
    leaf.h5 ||
    leaf.h6 ||
    leaf.bold
  ) {
    bold = true;
  }

  if (leaf.h1) {
    fontSize = 32;
  } else if (leaf.h2) {
    fontSize = 24;
  } else if (leaf.h3) {
    fontSize = 18;
  } else if (leaf.h4) {
    fontSize = 16;
  } else if (leaf.h5) {
    fontSize = 13;
  } else if (leaf.h6) {
    fontSize = 11;
  }

  return (
    <span
      {...attributes}
      style={{
        fontWeight: bold ? 'bold' : 'unset',
        fontStyle: leaf.italic ? 'italic' : 'unset',
        fontSize: fontSize,
        display: 'inline',
        backgroundColor: leaf.spoiler ? '#ccc' : 'unset',
      }}
    >
      {children}
    </span>
  );
};

export const useRenderLeaf = () => {
  return React.useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
};
