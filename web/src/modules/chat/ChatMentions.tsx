import { Avatar } from '../../components/Avatar';
import { BaseUser } from '../../lib/models';
import { useChatMentionStore } from './useChatMentionStore';

interface ChatMentionsProps {
  users?: BaseUser[];
  onMentionSelect: () => void;
}

export const ChatMentions: React.FC<ChatMentionsProps> = ({
  onMentionSelect,
}) => {
  const { activeMentionIndex, queriedUsers, setActiveMentionIndex } =
    useChatMentionStore();

  return (
    <div className='absolute bottom-full mb-2 left-3 right-4 bg-gray-50 border rounded-lg overflow-hidden p-2'>
      {queriedUsers.map((user, index) => (
        <div
          key={user.id}
          className={`p-2 rounded-md flex items-center justify-between ${
            activeMentionIndex === index ? 'bg-gray-200' : ''
          }`}
          onMouseOver={() => {
            setActiveMentionIndex(index);
          }}
          onClick={() => {
            onMentionSelect();
            setActiveMentionIndex(undefined);
          }}
        >
          <div className='flex items-center gap-2'>
            <Avatar
              size='xxs'
              username={user.username}
              isOnline={user.isOnline}
            />
            <p>{user.username}</p>
          </div>
          <div className='text-xs text-gray-600'>{`@${user.username}#${user.id}`}</div>
        </div>
      ))}
    </div>
  );
};
