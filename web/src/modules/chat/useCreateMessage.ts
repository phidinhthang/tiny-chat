import { useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { useTypeSafeMutation } from '../../hooks/useTypeSafeMutation';
import { useTypeSafeQuery } from '../../hooks/useTypeSafeQuery';
import { useTypeSafeUpdateQuery } from '../../hooks/useTypeSafeUpdateQuery';
import { ee } from '../../lib/ee';

export const useCreateMessage = () => {
  const queryClient = useQueryClient();
  const updateQuery = useTypeSafeUpdateQuery();
  const conversationId = useParams().conversationId as string;
  const { data: me } = useTypeSafeQuery('me');

  const { mutate } = useTypeSafeMutation('createMessage', {
    onMutate: async ([newMessage]) => {
      ee.emit('chatbox_scroll_to_bottom');
      const previousMessages = queryClient.getQueryData([
        'messages',
        conversationId,
      ]);
      const fakeId = Math.random().toString();
      updateQuery(['messages', conversationId], (paginatedMessages) => {
        paginatedMessages.items.unshift({
          id: fakeId,
          authorId: me!.id,
          content: newMessage.content,
          conversationId: newMessage.conversation_id,
          createdAt: new Date().toISOString(),
          isDeleted: false,
          reactions: {},
          isImage: newMessage.is_image,
          updatedAt: null,
          loading: true,
        });
        return paginatedMessages;
      });
      return { previousMessages, fakeId };
    },
    onSuccess: (message, [], { previouseMessages, fakeId }) => {
      ee.emit('chatbox_scroll_to_bottom');
      updateQuery(['messages', conversationId], (paginatedMessages) => {
        let msg = paginatedMessages.items.find((m) => m.id === fakeId);
        if (msg) {
          Object.assign(msg, message, { loading: false });
        }
        return paginatedMessages;
      });
      updateQuery('conversations', (conversations) => {
        const conversation = conversations.find(
          (c) => c.id === conversationId
        )!;
        conversation.lastMessageDisplay = {
          content: message.content,
          userId: me?.id as any,
          createdAt: message.createdAt,
          userName: me?.username as any,
        };
        return conversations;
      });
    },
    onError: (_, [], ctx) => {
      updateQuery(['messages', conversationId], (_) => {
        return ctx.previousMessages;
      });
    },
  });

  return mutate;
};
