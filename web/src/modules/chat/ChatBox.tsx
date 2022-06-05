import React from 'react';
import { useInView } from 'react-intersection-observer';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useTypeSafeQuery } from '../../hooks/useTypeSafeQuery';
import { wrap } from '../../lib/wrapper';
import { fetcher } from '../../lib/fetcher';
import { useTypeSafeUpdateQuery } from '../../hooks/useTypeSafeUpdateQuery';
import { BaseUser, Member } from '../../lib/models';
import { MessageNode } from './MessageNode';
import { InputController } from './InputController';
import { ChatHeader } from './ChatHeader';
import { DeleteMessageModal } from './DeleteMessageModal';
import { useTypeSafeMutation } from '../../hooks/useTypeSafeMutation';
import { ee } from '../../lib/ee';
import {
  ContextMenuContextProvider,
  MessageContextMenu,
} from './MessageContextMenu';
import { useUserMapStore } from './useUserMapStore';

const ChatBox = () => {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const [ref, inView] = useInView();

  const { data: conversation } = useTypeSafeQuery(
    ['conversation', conversationId!],
    { enabled: !!conversationId },
    [conversationId!]
  );
  const { data: paginatedMessages, isLoading } = useTypeSafeQuery(
    ['messages', conversationId! as string],
    { enabled: !!conversationId },
    [conversationId as string, { limit: `${25}` }]
  );
  const { data: members } = useTypeSafeQuery(
    ['conversationMembers', conversationId as string],
    { enabled: !!conversationId },
    [conversationId as string]
  );
  const { data: conversationUsers } = useTypeSafeQuery(
    ['conversationUsers', conversationId as string],
    { enabled: !!conversationId },
    [conversationId as string]
  );
  const { mutate: deleteMessage } = useTypeSafeMutation('deleteMessage');

  const memberMap = React.useMemo(() => {
    return members?.reduce((acc, member) => {
      acc[`${member.userId}`] = member;
      return acc;
    }, {} as Record<string, Member>);
  }, [members]);
  const userMap = React.useMemo(() => {
    return conversationUsers?.reduce((acc, user) => {
      acc[`${user.id}`] = user;
      return acc;
    }, {} as Record<string, BaseUser>);
  }, [conversationUsers]);
  const endRef = React.useRef<HTMLDivElement>(null);
  const updateQuery = useTypeSafeUpdateQuery();

  React.useEffect(() => {
    if (!isLoading && endRef.current) {
      endRef.current?.scrollIntoView({ behavior: 'auto' });
      ee.on('chatbox_scroll_to_bottom', () => {
        endRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    }
  }, [endRef.current, conversationId, isLoading]);

  React.useEffect(() => {
    const nextCursor = paginatedMessages?.nextCursor;
    if (inView && nextCursor) {
      wrap(fetcher)
        .query['messages'](conversationId as string, {
          limit: `${25}`,
          after: nextCursor,
        })
        .then((res) => {
          updateQuery(
            ['messages', conversationId as string],
            (paginatedMessages) => {
              paginatedMessages.items.push(...res.items);
              paginatedMessages.nextCursor = res.nextCursor;
              paginatedMessages.prevCursor = res.prevCursor;
              return paginatedMessages;
            }
          );
        });
    }
  }, [inView, paginatedMessages?.nextCursor]);

  React.useEffect(() => {
    console.log('user map ', userMap);
    if (userMap) useUserMapStore.getState().setUserMap(userMap);
  }, [userMap]);

  return (
    <div className='relative flex flex-col h-full w-full pb-3'>
      <ChatHeader conversation={conversation as any} />
      <div className='flex-auto overflow-y-auto flex flex-col-reverse z-5'>
        <div ref={endRef} style={{ float: 'left', clear: 'both' }}></div>
        {paginatedMessages?.items.map((message, index) => (
          <MessageNode
            key={index}
            message={message}
            nextMessage={
              index === 0 ? undefined : paginatedMessages.items[index - 1]
            }
            previousMessage={
              index === paginatedMessages.items.length - 1
                ? undefined
                : paginatedMessages.items[index + 1]
            }
            user={userMap?.[`${message.authorId}`]}
            member={memberMap?.[`${message.authorId}`]}
          />
        ))}
        {paginatedMessages?.nextCursor ? (
          <div ref={ref} className='pb-1'></div>
        ) : null}
      </div>
      <div className='px-3 mt-3 w-full relative'>
        <InputController
          conversationId={conversationId as string}
          users={conversationUsers}
        />
      </div>
      <DeleteMessageModal
        onConfirm={({ message }) => {
          deleteMessage(
            [{ messageId: message.id, conversationId: message.conversationId }],
            {
              onSuccess: () => {
                updateQuery(
                  ['messages', message.conversationId],
                  (messages) => {
                    const msg = messages.items.find((m) => m.id === message.id);
                    if (msg) {
                      msg.isDeleted = true;
                      msg.content = '';
                    }
                    return messages;
                  }
                );
              },
            }
          );
        }}
      />
      <MessageContextMenu />
    </div>
  );
};

const MemorizedChatBox = React.memo(ChatBox);

const ChatBoxWithMenuContextProvider = () => {
  return (
    <ContextMenuContextProvider>
      <MemorizedChatBox />
    </ContextMenuContextProvider>
  );
};

export { ChatBoxWithMenuContextProvider as ChatBox };
