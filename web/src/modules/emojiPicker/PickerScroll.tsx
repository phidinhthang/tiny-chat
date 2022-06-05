import React from 'react';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { EmojiObject, ItemRange, shallowDiffer } from './utils';
import { Emoji } from './Emoji';

interface PickerScrollProps {
  emojisPerRow: number;
  emojiSize: number;
  numberScrollRows: number;
  focusedEmoji: {
    emoji: EmojiObject;
    row: number;
    focusOnRender: boolean;
    preventScroll: boolean;
  } | null;
  emojiData: Record<string, EmojiObject[]>;
  refVirtualList: React.MutableRefObject<FixedSizeList>;
  handleClickInScroll: (
    emoji: EmojiObject,
    row: number
  ) => ((event: React.MouseEvent<HTMLLIElement>) => void) | undefined;
  handleMouseInScroll: (
    emoji: EmojiObject,
    row: number
  ) => ((event: React.MouseEvent<HTMLLIElement>) => void) | undefined;
  itemCount: number;
  itemRanges: ItemRange[];
  collapseHeightOnSearch: boolean;
}

const PickerScroll: React.FC<PickerScrollProps> = ({
  collapseHeightOnSearch,
  emojiData,
  emojiSize,
  emojisPerRow,
  focusedEmoji,
  handleClickInScroll,
  handleMouseInScroll,
  itemCount,
  itemRanges,
  numberScrollRows,
  refVirtualList,
}) => {
  const [arrayOfRows, setArrayOfRows] = React.useState<
    Record<number, JSX.Element>
  >({});
  const infiniteLoaderRef = React.useRef<InfiniteLoader>(null);

  const prevFocusedEmoji = React.useRef<{
    emoji: EmojiObject;
    row: number;
  } | null>(null);

  React.useEffect(() => {
    setArrayOfRows({});
    infiniteLoaderRef.current?.resetloadMoreItemsCache();
    prevFocusedEmoji.current = focusedEmoji;
    refVirtualList.current.scrollToItem(0);
    loadMoreItems(
      0,
      Math.min(numberScrollRows + 10 - 1, itemRanges[itemRanges.length - 1].to)
    );
  }, [emojiData, emojisPerRow]);

  React.useEffect(
    function resetRowsWithFocusedEmoji() {
      let prevEmoji = prevFocusedEmoji.current,
        nextEmoji = focusedEmoji;
      if (prevEmoji == nextEmoji) {
        return;
      }
      let rowsToUpdate =
        prevEmoji?.row == nextEmoji?.row
          ? [prevEmoji?.row]
          : [prevEmoji?.row, nextEmoji?.row];
      rowsToUpdate.forEach((row) => row && loadMoreItems(row, row));
      prevFocusedEmoji.current = nextEmoji;
      nextEmoji?.row && refVirtualList.current?.scrollToItem(nextEmoji.row);
    },
    [focusedEmoji]
  );

  const loadMoreItems = (startIndex: number, endIndex: number) => {
    const nextArrayOfRows: Record<any, any> = {};
    let i = startIndex,
      range: ItemRange | undefined;
    while (i <= endIndex) {
      range = itemRanges.find((range) => range.from <= i && i < range.to);
      if (range === undefined) break;

      for (
        let rowIndex = i;
        rowIndex < Math.min(range.to, endIndex + 1);
        rowIndex++
      ) {
        if (rowIndex == range.from) {
          nextArrayOfRows[rowIndex] = (
            <div
              className='emoji-picker-category-title'
              aria-rowindex={rowIndex + 1}
              aria-colindex={1}
            >
              {range.key}
            </div>
          );
        } else {
          const offset = rowIndex - range.from;
          const row = emojiData[range.key].slice(
            (offset - 1) * emojisPerRow,
            offset * emojisPerRow
          );

          nextArrayOfRows[rowIndex] = (
            <ul
              className='emoji-picker-category-emoji'
              role='row'
              aria-rowindex={rowIndex + 1}
            >
              {row.map((emoji: EmojiObject, colIndex: number) => {
                const liProps = {
                  key: emoji.unicode,
                  onClick: handleClickInScroll(emoji, rowIndex),
                  onMouseMove: handleMouseInScroll(emoji, rowIndex),
                  role: 'gridcell',
                  'aria-rowindex': rowIndex + 1,
                  'aria-colindex': colIndex + 1,
                  tabIndex: -1,
                  ...(emoji === focusedEmoji?.emoji && {
                    tabIndex: 0,
                    ref: (li: HTMLLIElement) =>
                      focusedEmoji.focusOnRender &&
                      li?.focus({ preventScroll: focusedEmoji.preventScroll }),
                  }),
                };
                const emojiProps = {
                  emoji,
                  ...(emoji === focusedEmoji?.emoji && {
                    className: 'emoji-picker-emoji-focused',
                  }),
                };
                return (
                  <li {...liProps}>
                    <Emoji {...emojiProps} />
                  </li>
                );
              })}
            </ul>
          );
        }
      }
      i = range.to;
    }
    setArrayOfRows((prev) => Object.assign({}, prev, nextArrayOfRows));
  };

  return (
    <InfiniteLoader
      ref={infiniteLoaderRef}
      itemCount={itemCount}
      loadMoreItems={loadMoreItems}
      isItemLoaded={(index) => !!arrayOfRows[index]}
      minimumBatchSize={numberScrollRows}
      threshold={10}
    >
      {({ onItemsRendered, ref }) => (
        // @ts-ignore
        <FixedSizeList
          onItemsRendered={onItemsRendered}
          ref={(list) => {
            ref(list);
            refVirtualList && ((refVirtualList.current as any) = list);
          }}
          itemCount={itemCount}
          itemData={arrayOfRows}
          itemSize={emojiSize}
          height={
            collapseHeightOnSearch
              ? Math.min(
                  itemCount * emojiSize + 9,
                  numberScrollRows * emojiSize
                )
              : numberScrollRows * emojiSize
          }
          innerElementType={innerElementType}
        >
          {MemoizedRow}
        </FixedSizeList>
      )}
    </InfiniteLoader>
  );
};

const MemoizedPickerScroll = React.memo(
  PickerScroll,
  function ScrollPropsAreEqual(prevProps, nextProps) {
    return (
      prevProps.focusedEmoji?.emoji == nextProps.focusedEmoji?.emoji &&
      prevProps.emojiData == nextProps.emojiData &&
      prevProps.collapseHeightOnSearch == nextProps.collapseHeightOnSearch &&
      prevProps.emojiSize == nextProps.emojiSize &&
      prevProps.emojisPerRow == nextProps.emojisPerRow
    );
  }
);

export { MemoizedPickerScroll as PickerScroll };

const VirtualRow: React.FC<{
  index: number;
  style: React.CSSProperties;
  data: any;
}> = ({ index, style, data }) => {
  return (
    <div className='emoji-picker-virtual-row' style={style}>
      {data[index]}
    </div>
  );
};

const MemoizedRow = React.memo(
  VirtualRow,
  function compareRowProps(prevProps, nextProps) {
    const {
      style: prevStyle,
      data: prevData,
      index: prevIndex,
      ...prevRest
    } = prevProps;
    const {
      style: nextStyle,
      data: nextData,
      index: nextIndex,
      ...nextRest
    } = nextProps;
    return (
      prevData[prevIndex] === nextData[nextIndex] &&
      !shallowDiffer(prevStyle, nextStyle) &&
      !shallowDiffer(prevRest, nextRest)
    );
  }
);

const LIST_PADDING_SIZE = 9;
const innerElementType = React.forwardRef(
  (
    { style, ...props }: { style: React.CSSProperties },
    ref: React.Ref<FixedSizeList>
  ) => (
    <div
      // @ts-ignore
      ref={ref}
      style={{
        ...style,
        height: `${parseFloat(style.height as any) + LIST_PADDING_SIZE}px`,
      }}
      {...props}
    />
  )
);
