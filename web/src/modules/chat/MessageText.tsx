import React from 'react';
import { emojiMap } from '../emojiPicker/emojiData';
import { parseText } from '../slateStuff/parseText';
import { useUserMapStore } from './useUserMapStore';

interface MessageTextProps {
  text: string;
  loading?: boolean;
}
export const MessageText: React.FC<MessageTextProps> = ({ text, loading }) => {
  const tokens = parseText(text.trim());

  return (
    <div
      className={`prose max-w-full mr-4 text-[15px] md:mr-8 lg:mr-12 ${
        loading ? 'opacity-40' : ''
      }`}
    >
      {tokens.length === 1 &&
      typeof tokens[0] !== 'string' &&
      tokens[0].type === 'emoji' ? (
        <Emoji name={tokens[0].value} size='lg' />
      ) : (
        tokens.map((token, index) => {
          if (typeof token === 'string') {
            return (
              <span className='break-all' key={index}>
                {token}
              </span>
            );
          }
          if (token.type === 'h1') {
            return <h1 key={index}>{token.value}</h1>;
          }
          if (token.type === 'h2') {
            return <h2 key={index}>{token.value}</h2>;
          }
          if (token.type === 'h3') {
            return <h3 key={index}>{token.value}</h3>;
          }
          if (token.type === 'h4') {
            return <h4 key={index}>{token.value}</h4>;
          }
          if (token.type === 'h5') {
            return <h5 key={index}>{token.value}</h5>;
          }
          if (token.type === 'h6') {
            return <h6 key={index}>{token.value}</h6>;
          }
          if (token.type === 'bold') {
            return <b key={index}>{token.value}</b>;
          }
          if (token.type === 'italic') {
            return <i key={index}>{token.value}</i>;
          }
          if (token.type === 'emoji') {
            return <Emoji key={index} size='sm' name={token.value} />;
          }
          if (token.type === 'mention') {
            const mentionedUser =
              useUserMapStore.getState().userMap[token.userId!];
            if (mentionedUser && mentionedUser.username === token.value) {
              return (
                <span
                  key={index}
                  className='bg-blue-200 text-blue-700 rounded-sm hover:underline cursor-pointer'
                >
                  @{token.value}
                </span>
              );
            } else {
              return (
                <span key={index}>
                  @{token.value}#{token.userId}
                </span>
              );
            }
          }
          if (token.type === 'link') {
            return (
              <a
                key={index}
                href={token.value}
                target='_blank'
                className='text-blue-500 underline'
              >
                {token.value}
              </a>
            );
          }
          if (token.type === 'spoiler') {
            return <Spoiler key={index} text={token.value} />;
          }
          if (token.value) {
            return <span key={index}>{token.value}</span>;
          }
        })
      )}
    </div>
  );
};

const Spoiler = ({ text }: { text: string }) => {
  const [show, setShow] = React.useState(false);
  return (
    <span
      className={`bg-gray-300 rounded-sm ${
        show
          ? 'text-black'
          : 'text-gray-300 hover:opacity-75 cursor-pointer select-none'
      }`}
      onClick={() => {
        setShow(true);
      }}
    >
      {text}
    </span>
  );
};

export const Emoji = ({ name, size }: { name: string; size: 'sm' | 'lg' }) => {
  const sizeClassnames = {
    sm: 'w-5 h-5',
    lg: 'w-10 h-10',
  };
  return (
    <span
      className={`w-5 h-5 inline-block ${sizeClassnames[size]} ${
        size === 'lg' ? 'my-[3px]' : ''
      }`}
    >
      <img
        className={`object-cover inline-block ${sizeClassnames[size]} m-0`}
        src={`/twemoji.svg#${emojiMap[name].unicode}`}
      />
    </span>
  );
};
