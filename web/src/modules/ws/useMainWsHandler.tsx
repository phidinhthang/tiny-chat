import React, { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { HashLoader } from '../../components/HashLoader';
import { useTypeSafeQuery } from '../../hooks/useTypeSafeQuery';
import { useTypeSafeUpdateQuery } from '../../hooks/useTypeSafeUpdateQuery';
import { fetcher } from '../../lib/fetcher';
import { BaseUser, Conversation, Message } from '../../lib/models';
import { useRefreshToken } from '../../lib/useRefreshToken';
import { wrap } from '../../lib/wrapper';
import { useWsHandlerStore } from './useWsHandlerStore';
import { WebSocketContext } from './WebSocketProvider';

export const useMainWsHandler = () => {
  const { socket } = React.useContext(WebSocketContext);
  const addListener = useWsHandlerStore((s) => s.addListener);
  const updateQuery = useTypeSafeUpdateQuery();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribes = [
      addListener('hi', (d) => {
        console.log('hello ', d);
      }),
      addListener(
        'new_message',
        (d: { message: Message; author: BaseUser }) => {
          const conversations =
            queryClient.getQueryData<Conversation[]>('conversations');
          let conversation = conversations?.find(
            (c) => c.id === d.message.conversationId
          );
          let messages = queryClient.getQueryData([
            'messages',
            d.message.conversationId,
          ]);
          if (messages) {
            updateQuery(['messages', d.message.conversationId], (messages) => {
              messages.items.unshift(d.message);
              return messages;
            });
          }
          if (conversation) {
            updateQuery('conversations', (conversations) => {
              let conversation = conversations!.find(
                (c) => c.id === d.message.conversationId
              )!;
              conversation.lastMessageDisplay = {
                content: d.message.content,
                userName: d.author.username,
                createdAt: d.message.createdAt,
                userId: d.message.authorId,
              };
              return conversations;
            });
          } else {
            wrap(fetcher)
              .query['conversation'](d.message.conversationId)
              .then((res) =>
                updateQuery('conversations', (conversations) => {
                  conversations.unshift(res);
                  return conversations;
                })
              );
          }
        }
      ),
      addListener('user_online', (d: any) => {
        queryClient.setQueriesData('users', (users) => {
          const user = (users as BaseUser[]).find((u) => u.id === d);
          if (user) {
            user.isOnline = true;
          }
          return users;
        });
        // queryClient.setQueriesData(
        //   ['conversationUsers', conversationId],
        //   (users) => {
        //     const user = (users as BaseUser[]).find((u) => u.id === d);
        //     if (user) {
        //       user.isOnline = true;
        //     }
        //     return users;
        //   }
        // );
        updateQuery('conversations', (conversations) => {
          const conversation = conversations.find((c) =>
            c.withs?.some((w) => w.userId === d)
          );
          if (conversation) {
            const withUser = conversation.withs?.find((w) => w.userId === d);
            if (withUser) {
              withUser.isOnline = true;
            }
          }
          return conversations;
        });
      }),
      addListener('user_offline', (d: any) => {
        console.log('user_offline', d);
        queryClient.setQueriesData('users', (users) => {
          const user = (users as BaseUser[]).find((u) => u.id === d);
          if (user) {
            user.isOnline = false;
            user.lastOnlineAt = new Date().toISOString();
          }
          return users;
        });
        // queryClient.setQueriesData(
        //   ['conversationUsers', conversationId],
        //   (users) => {
        //     const user = (users as BaseUser[]).find((u) => u.id === d);
        //     if (user) {
        //       user.isOnline = false;
        //       user.lastOnlineAt = new Date().toISOString();
        //     }
        //     return users;
        //   }
        // );
        updateQuery('conversations', (conversations) => {
          const conversation = conversations.find((c) =>
            c.withs?.some((w) => w.userId === d)
          );
          if (conversation) {
            const withUser = conversation.withs?.find((w) => w.userId === d);
            if (withUser) {
              withUser.isOnline = false;
              withUser.lastOnlineAt = new Date().toISOString();
            }
          }
          return conversations;
        });
      }),
      addListener(
        'reaction_updated',
        (d: {
          conversationId: string;
          messageId: string;
          emojiName: string;
          updateType: 'CREATED' | 'DELETED';
          userId: string;
        }) => {
          updateQuery(['messages', d.conversationId], (messages) => {
            let message = messages.items.find((m) => m.id === d.messageId);
            if (!message) {
              return messages;
            }
            if (d.updateType === 'DELETED') {
              if (message?.reactions?.[`${d.userId}:${d.emojiName}`]) {
                delete message.reactions[`${d.userId}:${d.emojiName}`];
              }
            } else if (d.updateType === 'CREATED') {
              message.reactions[`${d.userId}:${d.emojiName}`] = {
                createdAt: new Date().toISOString(),
                name: d.emojiName,
              };
            }
            return messages;
          });
        }
      ),
      addListener(
        'message_deleted',
        (d: { messageId: string; conversationId: string; userId: string }) => {
          updateQuery(['messages', d.conversationId], (messages) => {
            const message = messages.items.find((m) => m.id === d.messageId);
            if (message) {
              message.content = '';
              message.isDeleted = true;
            }
            return messages;
          });
        }
      ),
      addListener('new_user', (d: { user: BaseUser }) => {
        updateQuery('users', (users) => {
          if (users?.every((u) => u.id !== d.user.id)) {
            users.unshift(d.user);
          }
          return users;
        });
      }),
    ];

    return () => {
      unsubscribes.forEach((u) => u());
    };
  }, [socket, addListener]);
};

export const MainWsHandlerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  useMainWsHandler();
  const { isLoading } = useRefreshToken();
  if (isLoading)
    return (
      <div className='flex items-center justify-center w-full h-screen'>
        <HashLoader size={250} />
      </div>
    );
  return <>{children}</>;
};
