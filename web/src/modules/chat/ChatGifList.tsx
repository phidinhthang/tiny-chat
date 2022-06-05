import React from 'react';
import { Spinner } from '../../components/Spinner';
import useDebounce from '../../hooks/useDebounce';
import { fetcher } from '../../lib/fetcher';
import { GifObject } from '../../lib/models';
import { wrap } from '../../lib/wrapper';
import { useChatGiphyStore } from './useChatGiphyStore';

interface ChatGifListProps {
  onGifSelect: () => void;
}

export const ChatGifList: React.FC<ChatGifListProps> = ({ onGifSelect }) => {
  const { queriedText, activeGifIndex, setQueriedGifs, setActiveGifIndex } =
    useChatGiphyStore();
  const text = useDebounce(queriedText, 100);
  const [gifs, setGifs] = React.useState<GifObject[]>([]);
  const [isLoading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (text) {
      setLoading(true);
      wrap(fetcher)
        .query.searchGif(text)
        .then((res) => {
          setLoading(false);
          setGifs(res);
        });
    }
  }, [text, setGifs]);

  React.useEffect(() => {
    setQueriedGifs(gifs);
    if (gifs.length && queriedText) {
      setActiveGifIndex(0);
    } else {
      setActiveGifIndex(undefined);
    }
  }, [gifs, queriedText, setActiveGifIndex, setQueriedGifs]);

  if ((isLoading || text !== queriedText) && queriedText?.trim()) {
    return (
      <div className='absolute bottom-full mb-2 left-3 right-4 bg-gray-50 border rounded-lg overflow-hidden p-2'>
        <div className='flex p-4 justify-center items-center text-blue-500'>
          <Spinner size='lg' />
        </div>
      </div>
    );
  }

  if (!queriedText?.trim() || gifs.length === 0) {
    return <></>;
  }

  return (
    <div className='absolute bottom-full mb-2 left-3 right-4 bg-gray-50 border rounded-lg overflow-hidden p-2'>
      <div className='flex gap-1 font-semibold items-end mb-2'>
        <p className='uppercase text-[14px] text-gray-500'>
          Giphy content matching
        </p>
        <span className='text-sm'>{text}</span>
      </div>
      <div className='flex gap-2 overflow-x-auto overflow-y-hidden w-full'>
        {gifs.map((gif, index) => (
          <div
            key={gif.url}
            className={`p-2 py-1 rounded-md flex items-center justify-center gap-1 flex-shrink-0 rounded-md mb-1 ${
              index === activeGifIndex ? 'bg-gray-200' : ''
            }`}
            style={{ height: gif.height + 20, width: gif.width + 20 }}
            onMouseOver={() => {
              setActiveGifIndex(index);
            }}
            onClick={() => {
              onGifSelect();
            }}
          >
            <img src={gif.url} height={gif.height} width={gif.width} />
          </div>
        ))}
      </div>
    </div>
  );
};
