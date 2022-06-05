type FieldError = {
  path: string;
  messages: string[];
};

export const toErrorMap = (errors?: FieldError[]) => {
  return (errors || []).reduce((map, error) => {
    map[error.path] = error.messages;
    return map;
  }, {} as Record<string, string[]>);
};
