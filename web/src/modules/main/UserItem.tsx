import { BaseUser } from '../../lib/models';
import { Avatar } from '../../components/Avatar';
import { wrap } from '../../lib/wrapper';
import { fetcher } from '../../lib/fetcher';
import { useTypeSafeUpdateQuery } from '../../hooks/useTypeSafeUpdateQuery';
import { useNavigate } from 'react-router-dom';

interface UserItemProps {
  user: BaseUser;
  className?: string;
}

export const UserItem: React.FC<UserItemProps> = ({ user, className }) => {
  const updateQuery = useTypeSafeUpdateQuery();
  const navigate = useNavigate();
  return (
    <div
      onClick={() => {
        wrap(fetcher)
          .query['conversationByRecipient'](user.id)
          .then((conversation) => {
            updateQuery('conversations', (conversations) => {
              conversations.unshift(conversation);
              return conversations;
            });
            navigate(`/c/${conversation.id}`);
          });
      }}
      className={`flex mb-2 p-[6px] pb-3 rounded-[7px] shadow-sm cursor-pointer bg-white hover:bg-gray-200 ${className}`}
    >
      <div className='flex-shrink-0 w-9 h-9'>
        <Avatar
          size='sm'
          src={user.avatarUrl || ''}
          isOnline={user.isOnline}
          username={user.username}
        />
      </div>
      <div className='ml-3'>
        <div>{user.username}</div>
        <div className='text-sm text-gray-500 italic'>
          {/* {!user.isOnline && user.lastLoginAt
            ? t('common.ago', { time: new Date(user.lastLoginAt) })
            : null} */}
        </div>
      </div>
    </div>
  );
};
