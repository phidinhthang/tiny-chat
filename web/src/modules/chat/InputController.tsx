import { withReact, ReactEditor } from 'slate-react';
import {
  createEditor,
  Descendant,
  Range,
  Editor,
  Transforms,
  Element,
} from 'slate';
import deepEqual from 'fast-deep-equal';
import { emojiData, emojiList } from '../emojiPicker/emojiData';
import React from 'react';
import { BaseUser } from '../../lib/models';
import { useChatMentionStore } from './useChatMentionStore';
import { ChatMentions } from './ChatMentions';
import EmojiPicker from '../emojiPicker/EmojiPicker';
import { useChatEmojiStore } from './useChatEmojiStore';
import { ChatEmojiList } from './ChatEmojiList';
import { AddEmojiButton } from './AddEmojiButton';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { useCreateMessage } from './useCreateMessage';
import { runShake } from '../../lib/runShake';
import { withMentionAndEmoji } from '../slateStuff/withMentionAndEmoji';
import { BaseEditor, serialize } from '../slateStuff/BaseEditor';
import {
  getMentionOrEmojiBeforeCaret,
  getWordBeforeCaret,
} from '../slateStuff/utils';
import { withSlashCommand } from '../slateStuff/withSlashCommand';
import {
  SlashCommand,
  slashCommands,
  useSlashCommandStore,
} from './useSlashCommandStore';
import { useCommandOptionStore } from '../slateStuff/useCommandOptionStore';
import { ChatSlashCommandList } from './ChatSlashCommandList';
import { ChatCommandOptionList } from './ChatCommandOptionList';
import { CountContext } from '../../App';
import { withGiphySlashCommand } from '../slateStuff/withGiphySlashCommand';
import { ChatGifList } from './ChatGifList';
import { useChatGiphyStore } from './useChatGiphyStore';

interface InputControllerProps {
  conversationId: string;
  users?: BaseUser[];
}

let value: Descendant[] = [];
export const InputController: React.FC<InputControllerProps> = ({
  conversationId,
  users,
}) => {
  const count = React.useContext(CountContext);
  const editor = React.useMemo(
    () =>
      withGiphySlashCommand(
        withSlashCommand(withMentionAndEmoji(withReact(createEditor())))
      ),
    []
  );
  const {
    setActiveMentionIndex,
    setQueriedUsers,
    activeMentionIndex,
    queriedUsers,
  } = useChatMentionStore();
  const {
    setActiveEmojiIndex,
    setQueriedEmojis,
    activeEmojiIndex,
    queriedEmojis,
  } = useChatEmojiStore();
  const {
    setActiveCommandIndex,
    setQueriedCommands,
    activeCommandIndex,
    queriedCommands,
  } = useSlashCommandStore();
  const { activeGifIndex, setActiveGifIndex, queriedGifs } =
    useChatGiphyStore();
  const [commandOptions, setCommandOptions] = React.useState<
    Array<{ display: string; op: string }>
  >([]);
  const [commandOptionIndex, setCommandOptionIndex] = React.useState<
    number | undefined
  >(undefined);
  const mutate = useCreateMessage();
  const [showPicker, setShowPicker] = React.useState(false);

  const clearChatInput = React.useCallback(() => {
    Transforms.delete(editor, {
      at: {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, []),
      },
    });
  }, [editor]);

  const onMentionSelect = React.useCallback(() => {
    const beforeMatch = getMentionOrEmojiBeforeCaret('mention', editor);
    if (beforeMatch) {
      const activeUser = queriedUsers[activeMentionIndex!];
      if (activeUser.username.startsWith(beforeMatch?.[1])) {
        let mentionFragment = `${activeUser.username.replace(
          beforeMatch?.[1],
          ''
        )}#${activeUser.id}`;
        Editor.insertText(editor, mentionFragment);
      }
    }
  }, [editor, queriedUsers, activeMentionIndex]);

  const onEmojiSelect = React.useCallback(() => {
    const beforeMatch = getMentionOrEmojiBeforeCaret('emoji', editor);
    if (beforeMatch) {
      const activeEmoji = queriedEmojis[activeEmojiIndex!];
      if (activeEmoji.name.startsWith(`${beforeMatch?.[1]}`)) {
        let emojiFragment = `${activeEmoji.name.replace(
          beforeMatch?.[1],
          ''
        )}:`;
        Editor.insertText(editor, emojiFragment);
      }
    }
  }, [editor, queriedEmojis, activeEmojiIndex]);

  const onGifSelect = React.useCallback(() => {
    if (typeof activeGifIndex === 'number') {
      const gif = queriedGifs[activeGifIndex];
      mutate([
        { content: gif.url, is_image: true, conversation_id: conversationId },
      ]);
      setActiveGifIndex(undefined);
      clearChatInput();
    }
  }, [activeGifIndex, queriedGifs, setActiveGifIndex, clearChatInput, mutate]);

  const emojiPickerWrapperRef = React.useRef<HTMLDivElement>(null);
  const emojiButtonRef = React.useRef<HTMLButtonElement>(null);
  useOnClickOutside(emojiPickerWrapperRef, (e) => {
    if (emojiButtonRef.current?.contains(e.target as any)) {
      return;
    }
    setShowPicker(false);
  });

  return (
    <div
      className='bg-gray-100 rounded-lg py-2 px-3 flex gap-1'
      onBlur={() => {
        setTimeout(() => {
          setActiveMentionIndex(undefined);
          setActiveEmojiIndex(undefined);
        }, 200);
      }}
    >
      {typeof activeCommandIndex === 'number' ? <ChatSlashCommandList /> : null}
      <ChatGifList onGifSelect={onGifSelect} />
      {typeof commandOptionIndex === 'number' ? (
        <ChatCommandOptionList
          commandOptionIndex={commandOptionIndex}
          commandOptions={commandOptions}
          setCommandOptionIndex={setCommandOptionIndex}
        />
      ) : null}
      {typeof activeMentionIndex === 'number' ? (
        <ChatMentions
          onMentionSelect={() => {
            onMentionSelect();
            ReactEditor.focus(editor);
          }}
        />
      ) : null}
      {typeof activeEmojiIndex === 'number' ? (
        <ChatEmojiList
          onEmojiSelect={() => {
            onEmojiSelect();
            ReactEditor.focus(editor);
          }}
        />
      ) : null}
      <div className='absolute bottom-full mb-2 right-3'>
        {showPicker ? (
          <div ref={emojiPickerWrapperRef}>
            <EmojiPicker
              emojiData={emojiData}
              showNavbar
              onEmojiSelect={(emoji) => {
                editor.insertText(`:${emoji.name}:`);
                setShowPicker(false);
                ReactEditor.focus(editor);
              }}
            />
          </div>
        ) : null}
      </div>
      <BaseEditor
        editor={editor}
        onChange={(v) => {
          value = v;
          const serialized = serialize(editor.children);
          useChatGiphyStore.getState().setQueriedText(undefined);
          const filteredSlashCommands = slashCommands.filter(
            (c) =>
              `/${c.name}`.startsWith(serialized) && serialized.startsWith('/')
          );
          if (!deepEqual(queriedCommands, filteredSlashCommands)) {
            setQueriedCommands(filteredSlashCommands);
            if (filteredSlashCommands.length) {
              setActiveCommandIndex(0);
            } else {
              setActiveCommandIndex(undefined);
            }
          }
          let wordBeforeText = getWordBeforeCaret(editor, true);
          let parentSelectedNode =
            typeof wordBeforeText === 'string' &&
            Editor.parent(editor, Editor.path(editor, editor.selection!))[0];
          let ops: Array<{ display: string; op: string }> = [];
          if (Element.isElement(parentSelectedNode)) {
            if (
              serialized.startsWith('/shrug') &&
              parentSelectedNode.type !== 'shrug-message-option'
            ) {
              if (
                'message'.startsWith(wordBeforeText!) &&
                !useCommandOptionStore.getState().shrugMessagePresent
              ) {
                ops.push({ display: 'message', op: 'message:' });
              }
            } else if (
              serialized.startsWith('/giphy') &&
              parentSelectedNode.type !== 'giphy-query-option'
            ) {
              if (
                'query'.startsWith(wordBeforeText!) &&
                !useCommandOptionStore.getState().giphyQueryPresent
              ) {
                ops.push({ display: 'query', op: 'query:' });
              }
            } else if (parentSelectedNode.type === 'giphy-query-option') {
              const searchText = serialize(parentSelectedNode.children);
              useChatGiphyStore
                .getState()
                .setQueriedText(
                  searchText?.trim() ? searchText.trim() : undefined
                );
            }
          }

          if (!deepEqual(ops, commandOptions)) {
            if (ops.length) {
              setCommandOptionIndex(0);
            } else {
              setCommandOptionIndex(undefined);
            }
            setCommandOptions(() => [...ops]);
          }

          const mentionBeforeMatch = getMentionOrEmojiBeforeCaret(
            'mention',
            editor
          );
          const emojiBeforeMatch = getMentionOrEmojiBeforeCaret(
            'emoji',
            editor
          );

          if (mentionBeforeMatch) {
            const queriedUsers =
              users?.filter((u) =>
                u.username.startsWith(mentionBeforeMatch?.[1] || '')
              ) || [];

            setQueriedUsers(queriedUsers);
            if (queriedUsers.length) {
              setActiveMentionIndex(0);
            } else {
              setActiveMentionIndex(undefined);
            }
          } else if (emojiBeforeMatch) {
            const queriedEmojis = emojiList
              .filter((e) => e.name.startsWith(emojiBeforeMatch?.[1] || ''))
              .slice(0, 10);
            setQueriedEmojis(queriedEmojis);
            if (queriedEmojis.length) {
              setActiveEmojiIndex(0);
            } else {
              setActiveEmojiIndex(undefined);
            }
          } else {
            setQueriedUsers([]);
            setQueriedEmojis([]);
            setActiveMentionIndex(undefined);
            setActiveEmojiIndex(undefined);
          }
        }}
        onKeyDown={(e) => {
          if (typeof commandOptionIndex === 'number') {
            if (e.code === 'ArrowDown') {
              e.preventDefault();
              setCommandOptionIndex(
                commandOptionIndex === commandOptions.length - 1
                  ? 0
                  : commandOptionIndex
              );
            } else if (e.code === 'ArrowUp') {
              e.preventDefault();
              setCommandOptionIndex(
                commandOptionIndex === 0
                  ? commandOptions.length - 1
                  : commandOptionIndex - 1
              );
            } else if (e.code === 'Enter') {
              e.preventDefault();
              let text: string;
              if (
                commandOptions[commandOptionIndex].op.startsWith(
                  getWordBeforeCaret(editor)!
                )
              ) {
                text = commandOptions[commandOptionIndex].op.replace(
                  getWordBeforeCaret(editor)! || '',
                  ''
                );
              } else {
                text = commandOptions[commandOptionIndex].op;
              }
              Transforms.insertText(editor, text + ' ');
              return;
            }
          } else if (typeof activeCommandIndex === 'number') {
            if (e.code === 'ArrowDown') {
              e.preventDefault();
              setActiveCommandIndex(
                activeCommandIndex === queriedCommands.length - 1
                  ? 0
                  : activeCommandIndex + 1
              );
            } else if (e.code === 'ArrowUp') {
              e.preventDefault();
              setActiveCommandIndex(
                activeCommandIndex === 0
                  ? queriedCommands.length - 1
                  : activeCommandIndex - 1
              );
            } else if (e.code === 'Enter') {
              e.preventDefault();
              Transforms.select(editor, []);
              Transforms.insertText(
                editor,
                `/${queriedCommands[activeCommandIndex].name} `
              );
              return;
            }
          } else if (typeof activeMentionIndex === 'number') {
            if (e.code === 'ArrowDown') {
              e.preventDefault();
              setActiveMentionIndex(
                activeMentionIndex === queriedUsers.length - 1
                  ? 0
                  : activeMentionIndex + 1
              );
            }
            if (e.code === 'ArrowUp') {
              e.preventDefault();
              setActiveMentionIndex(
                activeMentionIndex === 0
                  ? queriedUsers.length - 1
                  : activeMentionIndex - 1
              );
            }
          } else if (typeof activeEmojiIndex === 'number') {
            if (e.code === 'ArrowDown') {
              e.preventDefault();
              setActiveEmojiIndex(
                activeEmojiIndex === queriedEmojis.length - 1
                  ? 0
                  : activeEmojiIndex + 1
              );
            }
            if (e.code === 'ArrowUp') {
              e.preventDefault();
              setActiveEmojiIndex(
                activeEmojiIndex === 0
                  ? queriedEmojis.length - 1
                  : activeEmojiIndex - 1
              );
            }
          } else if (typeof activeGifIndex === 'number') {
            if (e.code === 'ArrowDown') {
              e.preventDefault();
              setActiveGifIndex(
                activeGifIndex === queriedGifs.length - 1
                  ? 0
                  : activeGifIndex + 1
              );
            }
            if (e.code === 'ArrowUp') {
              e.preventDefault();
              setActiveGifIndex(
                activeGifIndex === 0
                  ? queriedGifs.length - 1
                  : activeGifIndex - 1
              );
            }
          }
          if (e.code === 'Enter') {
            e.preventDefault();
            if (typeof activeMentionIndex === 'number') {
              onMentionSelect();
              return;
            } else if (typeof activeEmojiIndex === 'number') {
              onEmojiSelect();
              return;
            } else if (typeof activeGifIndex === 'number') {
              onGifSelect();
              return;
            }
            const serializedValue = serialize(value);
            if (!serializedValue.trim()) {
              runShake('#shaking-container');
              return;
            }
            if (serializedValue.startsWith('/shrug')) {
              const paragraph = editor.children?.[0];
              if (Element.isElement(paragraph)) {
                const messageOption = paragraph.children.find(
                  (n) =>
                    Element.isElement(n) && n.type === 'shrug-message-option'
                );
                if (
                  Element.isElement(messageOption) &&
                  messageOption.type === 'shrug-message-option'
                ) {
                  mutate([
                    {
                      content:
                        serialize(messageOption.children).trim() +
                        ' ¯\\_(ツ)_/¯',
                      conversation_id: conversationId,
                      is_image: false,
                    },
                  ]);
                  clearChatInput();
                  return;
                }
              }
              runShake('#shaking-container');
              return;
            }
            mutate([
              {
                content: serializedValue,
                conversation_id: conversationId,
                is_image: false,
              },
            ]);
            console.log('value ', serializedValue);
            clearChatInput();
          }
        }}
      />
      <AddEmojiButton
        onClick={() => setShowPicker((show) => !show)}
        ref={emojiButtonRef}
      />
    </div>
  );
};
