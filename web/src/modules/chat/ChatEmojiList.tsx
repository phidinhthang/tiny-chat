import { useChatEmojiStore } from './useChatEmojiStore';

interface ChatEmojiListProps {
  onEmojiSelect: () => void;
}

export const ChatEmojiList: React.FC<ChatEmojiListProps> = ({
  onEmojiSelect,
}) => {
  const { activeEmojiIndex, queriedEmojis, setActiveEmojiIndex } =
    useChatEmojiStore();

  return (
    <div className='absolute bottom-full mb-2 left-3 right-4 bg-gray-50 border rounded-lg overflow-hidden p-2'>
      {queriedEmojis.map((emoji, index) => (
        <div
          key={emoji.name}
          className={`p-2 py-1 rounded-md flex items-center gap-1 ${
            activeEmojiIndex === index ? 'bg-gray-200' : ''
          }`}
          onMouseOver={() => {
            setActiveEmojiIndex(index);
          }}
          onClick={() => {
            onEmojiSelect();
          }}
        >
          <span className='w-5 h-5 inline-block mr-2'>
            <img
              src={`/twemoji.svg#${emoji.unicode}`}
              className='w-5 h-5 object-cover'
            />
          </span>
          <span className='text-gray-700'>:{emoji.name}:</span>
        </div>
      ))}
    </div>
  );
};
