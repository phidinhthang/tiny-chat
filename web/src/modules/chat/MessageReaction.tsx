import React from 'react';
import { useTypeSafeMutation } from '../../hooks/useTypeSafeMutation';
import { useTypeSafeQuery } from '../../hooks/useTypeSafeQuery';
import { useTypeSafeUpdateQuery } from '../../hooks/useTypeSafeUpdateQuery';
import { BaseUser } from '../../lib/models';
import { emojiMap } from '../emojiPicker/emojiData';

interface ReactionData {
  me: boolean;
  users: BaseUser[];
  latest: string;
}

interface MessageReactionProps {
  emojiName: string;
  d: ReactionData;
  conversationId: string;
  messageId: string;
}

export const MessageReaction: React.FC<MessageReactionProps> = ({
  emojiName,
  conversationId,
  d,
  messageId,
}) => {
  const { data: me } = useTypeSafeQuery('me');
  const { mutate: deleteReaction } = useTypeSafeMutation('deleteReaction');
  const { mutate: createReaction } = useTypeSafeMutation('createReaction');
  const updateQuery = useTypeSafeUpdateQuery();
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [tooltipPos, setTooltipPos] = React.useState<'top' | 'bottom'>('top');

  return (
    <div
      key={emojiName}
      className={`flex relative items-center border rounded-md px-1 py-[1px] cursor-pointer ${
        d.me ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onClick={() => {
        if (d.me) {
          deleteReaction(
            [
              {
                conversationId: conversationId,
                emojiName: emojiName,
                messageId: messageId,
              },
            ],
            {
              onSuccess: () => {
                updateQuery(['messages', conversationId], (messages) => {
                  const message = messages.items.find(
                    (m) => m.id === messageId
                  );
                  if (message) {
                    if (message.reactions?.[`${me?.id}:${emojiName}`]) {
                      delete message.reactions?.[`${me?.id}:${emojiName}`];
                    }
                  }
                  return messages;
                });
              },
            }
          );
        } else {
          createReaction(
            [
              {
                conversationId: conversationId,
                emojiName: emojiName,
                messageId,
              },
            ],
            {
              onSuccess: () => {
                updateQuery(['messages', conversationId], (messages) => {
                  const message = messages.items.find(
                    (m) => m.id === messageId
                  );
                  if (message) {
                    message.reactions[`${me?.id}:${emojiName}`] = {
                      createdAt: new Date().toISOString(),
                      name: emojiName,
                    };
                  }
                  return messages;
                });
              },
            }
          );
        }
      }}
      onMouseEnter={() => {
        setShowTooltip(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
      }}
    >
      {showTooltip ? (
        <div>
          <div className='bg-white flex gap-2 z-[5] absolute bottom-full mb-0 left-1/2 -translate-x-1/2 p-4 ml-5 mb-3 rounded-md shadow-2xl w-[240px]'>
            <span className='w-12 h-12 inline-block mr-1 flex-shrink-0'>
              <img
                className='m-0 w-12 h-12 object-cover'
                src={`/twemoji.svg#${emojiMap[emojiName].unicode}`}
              />
            </span>
            <div className='w-50'>
              <p className='text-sm font-semibold text-gray-600'>
                {d.users.map((u) => u.username).join(', ')} reacted with :
                {emojiName}:
              </p>
            </div>
            <div className='absolute bg-transparent top-full w-0 h-0 mt-0 left-1/2 bg-white -translate-x-[30px] border-white border-l border-r border-t border-l-transparent border-r-transparent border-l-[10px] border-r-[10px] border-t-[10px]'></div>
          </div>
        </div>
      ) : null}
      <span className='w-5 h-5 inline-block mr-1'>
        <img
          className='m-0 w-5 h-5 object-cover'
          src={`/twemoji.svg#${emojiMap[emojiName].unicode}`}
        />
      </span>
      <span>{d.users.length}</span>
    </div>
  );
};
