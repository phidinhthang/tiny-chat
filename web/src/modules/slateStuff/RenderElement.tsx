import React from 'react';
import { RenderElementProps, useSelected } from 'slate-react';
import { useCommandOptionStore } from './useCommandOptionStore';

export const useRenderElement = () => {
  return React.useCallback((props: RenderElementProps) => {
    return <RenderElement {...props} />;
  }, []);
};

const RenderElement = (props: RenderElementProps) => {
  const { element, attributes, children } = props;
  const selected = useSelected();

  switch (element.type) {
    case 'mention':
      return (
        <span
          {...attributes}
          data-user={element.userId}
          contentEditable={false}
        >
          <span
            className={`content-box border h-[24px] leading-3 px-1 py-1 bg-blue-100 text-blue-500 inline-block rounded-md mb-[1px] ${
              selected ? 'border-violet-500' : ''
            }`}
          >
            @{element.username}
          </span>
          <span>{children}</span>
        </span>
      );
    case 'emoji':
      return (
        <span
          {...attributes}
          contentEditable={false}
          className='relative inline-block'
        >
          <span
            className={`inline-block rounded-xl w-[22px] h-[22px] h-full ${
              selected ? 'border-violet-500' : ''
            }`}
          >
            <img
              src={`/twemoji.svg#${element.unicode}`}
              className={`object-cover w-full h-full mt-1`}
              alt={element.name}
            />
          </span>
          <span>{children}</span>
        </span>
      );
    case 'shrug-message-option':
      return <ShrugMessageOptionElement {...props} />;
    case 'giphy-query-option':
      return <GiphyQueryOptionElement {...props} />;
    default:
      return (
        <p {...attributes} className='leading-[1.375rem] align-baseline'>
          {children}
        </p>
      );
  }
};

const ShrugMessageOptionElement = ({
  attributes,
  children,
  element,
}: RenderElementProps) => {
  const { setShrugMessagePresent } = useCommandOptionStore();

  React.useEffect(() => {
    setShrugMessagePresent(true);

    return () => {
      setShrugMessagePresent(false);
    };
  }, []);

  return (
    <span
      {...attributes}
      className='border border-blue-500 inline-flex items-center h-full rounded-md overflow-hidden'
    >
      <span
        contentEditable={false}
        className='bg-blue-100 text-gray-600 font-semibold h-full inline-flex items-center px-1 mb-[1px]'
      >
        message
      </span>
      <span className='px-1 h-full mb-[1px]'>{children}</span>
    </span>
  );
};

const GiphyQueryOptionElement = ({
  attributes,
  children,
  element,
}: RenderElementProps) => {
  const { setGiphyQueryPresent } = useCommandOptionStore();

  React.useEffect(() => {
    setGiphyQueryPresent(true);

    return () => {
      setGiphyQueryPresent(false);
    };
  }, []);

  return (
    <span
      {...attributes}
      className='border border-blue-500 inline-flex items-center h-full rounded-md overflow-hidden'
    >
      <span
        contentEditable={false}
        className='bg-blue-100 text-gray-600 font-semibold h-full inline-flex items-center px-1 mb-[1px]'
      >
        query
      </span>
      <span className='px-1 h-full mb-[1px]'>{children}</span>
    </span>
  );
};
