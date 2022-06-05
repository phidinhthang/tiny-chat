export interface EmojiObject {
  unicode: string;
  name: string;
  keywords?: string[];
}

export function unifiedToNative(unified: string) {
  const codePoints = unified.split('-').map((u) => parseInt(u, 16));
  return String.fromCodePoint.apply(String, codePoints);
}

export type ItemRange = {
  key: string;
  from: number;
  to: number;
  length: number;
};

export function measureScrollbar(): number {
  if (typeof document == 'undefined') return 0;
  const div = document.createElement('div');
  div.style.cssText =
    'width:100px; height:100px; overflow:scroll; position:absolute; top:-9999px';
  document.body.appendChild(div);
  const scrollbarWidth = div.offsetWidth - div.clientWidth;
  document.body.removeChild(div);
  return scrollbarWidth;
}

export function calcCountAndRange(data: Record<string, any[]>, perRow: number) {
  let itemCount = 0;
  let itemRanges: ItemRange[] = [];
  Object.entries(data).forEach(([key, array]) => {
    if (array.length === 0) return;
    let from = itemCount;
    let to = itemCount + 1 + Math.ceil(array.length / perRow);
    itemRanges.push({ key, from, to, length: array.length });
    itemCount = to;
  });

  return { itemCount, itemRanges };
}

export function shallowDiffer(
  prev: Record<string, any>,
  next: Record<string, any>
) {
  for (let attribute in prev) {
    if (!(attribute in next)) {
      return true;
    }
  }

  for (let attribute in next) {
    if (prev[attribute] !== next[attribute]) {
      return true;
    }
  }

  return false;
}
