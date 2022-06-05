import { BaseEditor, Descendant } from 'slate';
import { ReactEditor } from 'slate-react';

export type ParagraphElement = {
  type: 'paragraph';
  align?: string;
  children: Descendant[];
};

export type MentionElement = {
  type: 'mention';
  children: Descendant[];
  username: string;
  userId: string;
};

export type EmojiElement = {
  type: 'emoji';
  name: string;
  children: Descendant[];
  unicode: string;
};

export type ShrugMessageOptionElement = {
  type: 'shrug-message-option';
  children: Descendant[];
};

export type GiphyQueryOptionElement = {
  type: 'giphy-query-option';
  children: Descendant[];
};

export type CustomElement =
  | ParagraphElement
  | MentionElement
  | EmojiElement
  | ShrugMessageOptionElement
  | GiphyQueryOptionElement;

export type CustomText = {
  bold?: boolean;
  italic?: boolean;
  h1?: boolean;
  h2?: boolean;
  h3?: boolean;
  h4?: boolean;
  h5?: boolean;
  h6?: boolean;
  link?: boolean;
  spoiler?: boolean;
  text: string;
};

export type CustomEditor = BaseEditor & ReactEditor;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
