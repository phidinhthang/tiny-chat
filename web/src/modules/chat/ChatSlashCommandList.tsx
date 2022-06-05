import { useSlashCommandStore } from './useSlashCommandStore';

export const ChatSlashCommandList = () => {
  const { activeCommandIndex, queriedCommands, setActiveCommandIndex } =
    useSlashCommandStore();
  return (
    <div className='absolute bottom-full mb-2 left-3 right-4 bg-gray-50 border rounded-lg overflow-hidden p-2'>
      {queriedCommands.map((command, index) => (
        <div
          key={command.name}
          className={`p-3 py-2 rounded-md flex items-center gap-1 ${
            activeCommandIndex === index ? 'bg-gray-200' : ''
          }`}
          onMouseOver={() => {
            setActiveCommandIndex(index);
          }}
        >
          <div>
            <div className='flex items-center gap-1 text-gray-600 text-[15px]'>
              <p className='text-black'>{command.name}</p>
              <span>|</span>
              <span className='text-[13px] mt-[2px]'>
                +{Object.keys(command.options).length} optional
              </span>
            </div>
            <p className='text-[12px] text-gray-400'>{command.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
