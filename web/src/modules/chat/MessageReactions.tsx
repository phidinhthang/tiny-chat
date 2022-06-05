import React from 'react';
import { useTypeSafeQuery } from '../../hooks/useTypeSafeQuery';
import { BaseUser } from '../../lib/models';
import { MessageReaction } from './MessageReaction';

interface MessageReactionsProps {
  reactions: Record<string, { createdAt: string; name: string }>;
  conversationId: string;
  messageId: string;
}

export const MessageReactions = ({
  reactions,
  conversationId,
  messageId,
}: MessageReactionsProps) => {
  const { data: me } = useTypeSafeQuery('me');
  const { data: users } = useTypeSafeQuery([
    'conversationUsers',
    conversationId,
  ]);
  const userMap =
    React.useMemo(() => {
      return users?.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, BaseUser>);
    }, [users]) || ({} as Record<string, BaseUser>);
  const groupedReactions = Object.entries(reactions).reduce(
    (acc, [userIdAndEmoji, emojiInfo]) => {
      const [userId, emojiName] = userIdAndEmoji.split(':');
      const isMe = userId === me?.id;
      if (!acc[emojiName]) {
        acc[emojiName] = {
          me: isMe,
          users: [userMap[userId]],
          latest: emojiInfo.createdAt,
        };
      } else {
        acc[emojiName].users.push(userMap[userId]);
        if (isMe) {
          acc[emojiName].me = true;
        }
        if (emojiInfo.createdAt > acc[emojiName].latest) {
          acc[emojiName].latest = emojiInfo.createdAt;
        }
      }
      return acc;
    },
    {} as { [Key: string]: { me: boolean; users: BaseUser[]; latest: string } }
  );

  return Object.keys(groupedReactions).length > 0 ? (
    <div className='flex gap-1 mb-1'>
      {Object.entries(groupedReactions)
        .filter(([_, d]) => d.users.length > 0)
        .map(([emojiName, d]) => (
          <MessageReaction
            d={d}
            emojiName={emojiName}
            conversationId={conversationId}
            messageId={messageId}
            key={emojiName}
          />
        ))}
    </div>
  ) : (
    <div />
  );
};
