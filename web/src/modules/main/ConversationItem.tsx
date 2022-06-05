import { useNavigate } from 'react-router-dom';
import { useTypeSafeQuery } from '../../hooks/useTypeSafeQuery';
import { Conversation } from '../../lib/models';
import { Avatar } from '../../components/Avatar';

interface ConversationItemProps {
  conversation: Conversation;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
}) => {
  const { data: me } = useTypeSafeQuery('me');
  const navigate = useNavigate();
  const withs = conversation?.withs?.filter((w) => w.userId !== me?.id);
  return (
    <div
      className='position flex mb-2 overflow-x-hidden overflow-y-hidden center p-[6px] pb-1 rounded-[7px] shadow-sm cursor-pointer bg-white hover:bg-gray-200'
      onClick={() => {
        navigate(`/c/${conversation.id}`);
      }}
    >
      <div className='flex-shrink-0 w-9 h-9'>
        <Avatar
          username={withs?.[0]?.username}
          isOnline={withs?.[0]?.isOnline}
          size='sm'
        />
      </div>
      <div className='ml-3 w-[200px]'>
        <h3 className='text-[15px]'>{withs?.[0]?.username}</h3>
        <p className='text-[12px] h-[20px] text-[#65676b] truncate max-w-[200px]'>
          {conversation.lastMessageDisplay.content}
        </p>
      </div>
    </div>
  );
};
