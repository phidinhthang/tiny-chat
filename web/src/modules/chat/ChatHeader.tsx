import { Avatar } from '../../components/Avatar';
import { useTypeSafeQuery } from '../../hooks/useTypeSafeQuery';
import { Conversation } from '../../lib/models';

interface ChatHeaderProps {
  conversation: Conversation | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation }) => {
  const { data: me } = useTypeSafeQuery('me');
  let withs = conversation?.withs?.filter((w) => w.userId !== me?.id);

  return (
    <div className='h-16 flex items-center px-3 py-3 border-b border-gray-300 bg-[#F5F7FB]'>
      <div className='flex gap-3'>
        <Avatar
          src={withs?.[0]?.avatarUrl}
          username={withs?.[0].username}
          isOnline={withs?.[0].isOnline}
          size='sm'
        />
        <div>
          <p>{withs?.[0].username}</p>
          <p>{withs?.[0].isOnline}</p>
        </div>
      </div>
    </div>
  );
};
