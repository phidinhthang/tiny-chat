interface ChatCommandOptionListProps {
  commandOptions: Array<{
    display: string;
    op: string;
  }>;
  commandOptionIndex: number;
  setCommandOptionIndex: React.Dispatch<
    React.SetStateAction<number | undefined>
  >;
}

export const ChatCommandOptionList: React.FC<ChatCommandOptionListProps> = ({
  commandOptions,
  commandOptionIndex,
  setCommandOptionIndex,
}) => {
  return (
    <div className='absolute bottom-full mb-2 left-3 right-4 bg-gray-50 border rounded-lg overflow-hidden p-2'>
      {commandOptions.map((option, index) => (
        <div
          key={option.op}
          className={`p-2 py-1 rounded-md flex items-center gap-1 ${
            commandOptionIndex === index ? 'bg-gray-200' : ''
          }`}
          onMouseOver={() => {
            setCommandOptionIndex(index);
          }}
        >
          {option.display}
        </div>
      ))}
    </div>
  );
};
