import React from 'react';
import { Avatar } from '../../components/Avatar';
import { EmojiAddIcon } from '../../icons/EmojiAddIcons';
import { BaseUser, Member, Message } from '../../lib/models';
import { MessageReactions } from './MessageReactions';
import { MessageText } from './MessageText';
import EmojiPicker from '../emojiPicker/EmojiPicker';
import { emojiData } from '../emojiPicker/emojiData';
import { useTypeSafeUpdateQuery } from '../../hooks/useTypeSafeUpdateQuery';
import { useTypeSafeMutation } from '../../hooks/useTypeSafeMutation';
import { useTypeSafeQuery } from '../../hooks/useTypeSafeQuery';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { useTransition } from 'transition-hook';
import { SolidTrashIcon } from '../../icons/SolidTrashIcon';
import { useDeleteMessageModalStore } from './useDeleteMessageModalStore';
import { ee } from '../../lib/ee';
import { useContextMenuContext } from './MessageContextMenu';

interface MessageNodeProps {
  message: Message;
  previousMessage?: Message;
  nextMessage?: Message;
  user?: BaseUser;
  member?: Member;
}
export const MessageNode: React.FC<MessageNodeProps> = ({
  message,
  member,
  nextMessage,
  previousMessage,
  user,
}) => {
  const showHeader =
    !previousMessage ||
    previousMessage.authorId !== message.authorId ||
    new Date(message.createdAt).getTime() -
      new Date(previousMessage.createdAt).getTime() >
      1000 * 60 * 5;
  const [isHover, setHover] = React.useState(false);
  const { setContextMenu } = useContextMenuContext();
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const emojiPickerTrans = useTransition(showEmojiPicker, 200);
  const emojiPickerBtnRef = React.useRef<HTMLButtonElement>(null);
  const emojiPickerWrapperRef = React.useRef<HTMLDivElement>(null);
  const messageNodeRef = React.useRef<HTMLDivElement>(null);
  const [emojiPickerTopPosition, setEmojiPickerTopPosition] =
    React.useState<number>(0);
  const { data: me } = useTypeSafeQuery('me');
  const { mutate: createReaction } = useTypeSafeMutation('createReaction');
  const updateQuery = useTypeSafeUpdateQuery();
  const createdAt = new Date(message.createdAt);
  const headerTime = createdAt.toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeInfo = createdAt.toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  useOnClickOutside(emojiPickerWrapperRef, (e) => {
    if (emojiPickerBtnRef.current?.contains(e.target as Node)) {
      return;
    }
    setShowEmojiPicker(false);
  });

  React.useEffect(() => {
    document.addEventListener('contextmenu', (event) => {
      // if (messageNodeRef.current?.contains(event.target as Node)) {
      //   event.preventDefault();
      //   setContextMenu({
      //     left: event.pageX,
      //     top: event.pageY,
      //     message,
      //     rightHandSide: false,
      //   });
      // }
    });
  }, []);

  const canDelete = message.authorId === me?.id && !message.isDeleted;

  return (
    <div
      ref={messageNodeRef}
      className={`flex relative px-3 ${showHeader ? 'mt-2 pt-1' : ''} ${
        isHover ? 'bg-gray-100' : ''
      }`}
      onMouseEnter={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onMouseLeave={() => {
        setHover(false);
        // setShowEmojiPicker(false);
      }}
    >
      {isHover ? (
        <div className='flex border border-gray-300 bg-white rounded-md hover:shadow-sm absolute bottom-full -mb-2 right-0 z-10'>
          <button
            className='w-8 h-8 flex items-center justify-center rounded-sm hover:bg-gray-200 relative'
            onClick={() => {
              setShowEmojiPicker((show) => !show);
              let emojiPickerBtnTopPos =
                emojiPickerBtnRef.current!.getBoundingClientRect().top;
              let emojiPickerHeight = 450;
              let top =
                window.innerHeight > emojiPickerHeight + emojiPickerBtnTopPos
                  ? emojiPickerBtnTopPos
                  : window.innerHeight - emojiPickerHeight;
              setEmojiPickerTopPosition(top);
            }}
            ref={emojiPickerBtnRef}
          >
            <EmojiAddIcon width={20} height={20} />
          </button>
          {canDelete ? (
            <button
              className='w-8 h-8 text-red-500 flex items-center justify-center rounded-sm hover:bg-gray-200 relative'
              onClick={() => {
                useDeleteMessageModalStore.getState().setMessage(message);
              }}
            >
              <SolidTrashIcon />
            </button>
          ) : null}
        </div>
      ) : null}
      <div
        className={`fixed right-full z-[100]`}
        style={{ top: emojiPickerTopPosition, right: canDelete ? 90 : 60 }}
        ref={emojiPickerWrapperRef}
      >
        {emojiPickerTrans.shouldMount ? (
          <div
            className={`${
              emojiPickerTrans.stage === 'enter'
                ? 'opacity-100 translate-x-0'
                : 'opacity-80 -translate-x-4'
            }`}
          >
            <EmojiPicker
              showNavbar
              emojiData={emojiData}
              onEmojiSelect={(emoji) => {
                if (message.reactions?.[`${me?.id}:${emoji.name}`]) return;
                createReaction(
                  [
                    {
                      messageId: message.id,
                      conversationId: message.conversationId,
                      emojiName: emoji.name,
                    },
                  ],
                  {
                    onSuccess: () => {
                      updateQuery(
                        ['messages', message.conversationId],
                        (messages) => {
                          const msg: Message | undefined = messages.items.find(
                            (m) => m.id === message?.id
                          );
                          if (msg) {
                            if (!msg.reactions?.[`${me?.id}:${emoji.name}`]) {
                              msg.reactions[`${me?.id}:${emoji.name}`] = {
                                createdAt: new Date().toISOString(),
                                name: emoji.name,
                              };
                            }
                          }
                          return messages;
                        }
                      );
                    },
                  }
                );
              }}
            />
          </div>
        ) : null}
      </div>
      <div className='w-16 flex mr-2 mt-1'>
        {showHeader ? (
          <div className=''>
            <Avatar
              username={user?.username}
              isOnline={user?.isOnline}
              size='sm'
            />
          </div>
        ) : null}
        {!showHeader && isHover ? (
          <p className='text-gray-500 text-sm'>{timeInfo}</p>
        ) : null}
      </div>
      <div className='flex-1 break-all'>
        {showHeader ? (
          <div className='flex gap-2 items-center'>
            <span className='font-bold'>{user?.username}</span>
            <p className='text-sm text-gray-500'>{headerTime}</p>
          </div>
        ) : null}
        {message.isDeleted ? (
          <p className='italic bold'>
            <b>this message has been deleted</b>
          </p>
        ) : message.isImage ? (
          <div className='w-full max-w-[360px] rounded-md overflow-hidden mt-1 mb-2'>
            <img
              className='object-cover'
              src={message.content}
              onLoad={() => {
                if (message.loading) {
                  setTimeout(() => {
                    ee.emit('chatbox_scroll_to_bottom');
                  }, 100);
                }
              }}
            />
          </div>
        ) : (
          <MessageText text={message.content} loading={message.loading} />
        )}
        {message.reactions ? (
          <MessageReactions
            conversationId={message.conversationId}
            reactions={message.reactions}
            messageId={message.id}
          />
        ) : null}
      </div>
    </div>
  );
};
