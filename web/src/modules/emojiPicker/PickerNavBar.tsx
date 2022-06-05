import React from 'react';
import { Emoji } from './Emoji';
import { EmojiObject } from './utils';

interface PickerNavbarProps {
  data: Record<string, EmojiObject[]>;
  handleSelectInNavbar: Function;
  [key: string]: any;
}
const PickerNavbar: React.FC<PickerNavbarProps> = ({
  data,
  handleSelectInNavbar,
  ...props
}) => {
  const [index, setIndex] = React.useState(0);

  const onNavbarKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'Enter':
        return handleSelectInNavbar(Object.keys(data)[index]);
      case 'ArrowLeft':
        return index > 0 && setIndex((index) => index - 1);
      case 'ArrowRight':
        return (
          index < Object.keys(data).length - 1 && setIndex((index) => index + 1)
        );
      case 'Home':
        return index > 0 && setIndex(0);
      case 'End':
        return (
          index < Object.keys(data).length - 1 &&
          setIndex(Object.keys(data).length - 1)
        );
    }
  };

  const onNavbarClick =
    (index: number, category: string) =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setIndex(index);
      handleSelectInNavbar(category);
    };

  return (
    <div
      className='emoji-picker-navbar'
      {...props}
      role='tablist'
      aria-label='emoji categories'
    >
      {Object.entries(data).map(([category, list], i) => {
        const props: React.ComponentPropsWithoutRef<'button'> = {
          className: 'emoji-picker-navbar-category',
          key: `navbar-${category}`,
          onClick: onNavbarClick(i, category),
          onKeyDown: onNavbarKeyDown,
          role: 'tab',
          'aria-label': category,
          'aria-selected': false,
          tabIndex: -1,
          ...(i == index && {
            'aria-selected': true,
            tabIndex: 0,
            ref: (button: HTMLButtonElement) =>
              Boolean(
                document.activeElement?.closest('.emoji-picker-navbar') &&
                  button?.focus()
              ),
          }),
        };

        return <button {...props}>{<Emoji emoji={list[0]} />}</button>;
      })}
    </div>
  );
};

const MemoizedNavbar = React.memo(PickerNavbar);

export { MemoizedNavbar as PickerNavbar };
