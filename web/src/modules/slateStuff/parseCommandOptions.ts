export const shrugMessage = /message:(.*)/;
export const shrugOptions = /(message:.*)|(query:.*)/g;

export const giphyQuery = /query:(.*)/;

interface IgnoreOptions {
  shrugMessage?: boolean;
  giphyQuery?: boolean;
}

export const getCommandOptionType = (
  text: string,
  type: string,
  ignoreOptions?: IgnoreOptions
) => {
  if (
    text.match(shrugMessage) &&
    !ignoreOptions?.shrugMessage &&
    type === 'shrug'
  ) {
    return {
      type: 'shrug-message' as const,
      value: text.replace(shrugMessage, '$1'),
      raw: text,
    };
  }

  if (
    text.match(giphyQuery) &&
    !ignoreOptions?.giphyQuery &&
    type === 'giphy'
  ) {
    return {
      type: 'giphy-query' as const,
      value: text.replace(giphyQuery, '$1'),
      raw: text,
    };
  }

  return text;
};

export const parseCommandOptions = (
  text: string,
  type: string,
  ignoreOptions?: IgnoreOptions
) => {
  const vals = text.split(shrugOptions).filter((v) => !!v);

  return vals.map((e) => {
    return getCommandOptionType(e, type, ignoreOptions);
  });
};
