const markdownRegex =
  /(^#+.*)|(\*\*.*?\*\*)|(\*.+?\*)|(https?\:\/\/[^ ]+)|(@[a-zA-Z0-9]+#[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})|(:[^ ]+:)|(\|\|.+?\|\|)/gi;
const boldRegex = /\*\*(.*)\*\*/i;
const italicRegex = /\*(.+)\*/i;
const headingRegex = /^(#+)(.*)/i;
const linkRegex = /(https?\:\/\/[^ ]+)/i;
const mentionRegex =
  /^@([a-zA-Z0-9]+)#([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
const emojiRegex = /^:([^ ]+):$/i;
const spoilerRegex = /^\|\|(.+)\|\|$/;

const getType = (str: string) => {
  if (str.match(headingRegex)) {
    const level = str.replace(headingRegex, '$1');
    if (level.length >= 1 && level.length <= 6) {
      return {
        type: `h${level.length}` as const,
        value: str.replace(headingRegex, '$2'),
        raw: str,
      };
    } else {
      return str;
    }
  }

  if (str.match(linkRegex)) {
    return {
      type: 'link' as const,
      value: str,
      raw: str,
    };
  }

  if (str.match(mentionRegex)) {
    return {
      type: 'mention' as const,
      value: str.replace(mentionRegex, '$1'),
      userId: str.replace(mentionRegex, '$2'),
      raw: str,
    };
  }

  if (str.match(emojiRegex)) {
    return {
      type: 'emoji' as const,
      value: str.replace(emojiRegex, '$1'),
      raw: str,
    };
  }

  if (str.match(spoilerRegex)) {
    return {
      type: 'spoiler' as const,
      value: str.replace(spoilerRegex, '$1'),
      raw: str,
    };
  }

  if (str.match(boldRegex)) {
    return {
      type: 'bold' as string,
      value: str.replace(boldRegex, '$1'),
      raw: str,
    };
  }

  if (str.match(italicRegex)) {
    return {
      type: 'italic' as const,
      value: str.replace(italicRegex, '$1'),
      raw: str,
    };
  }

  return str;
};

export const parseText = (text: string) => {
  const vals = text.split(markdownRegex).filter((v) => Boolean(v));

  return vals.map((e) => {
    return getType(e);
  });
};
