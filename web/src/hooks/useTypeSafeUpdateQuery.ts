import { wrap } from '../lib/wrapper';
import { useCallback, useContext } from 'react';
import { useQueryClient } from 'react-query';
import { Await } from '../util-types';

type QueryKey = keyof ReturnType<typeof wrap>['query'];

type PaginatedKey<K extends QueryKey> = [K, ...(string | number | boolean)[]];

export const useTypeSafeUpdateQuery = () => {
  const client = useQueryClient();

  return useCallback(
    <K extends QueryKey>(
      key: K | PaginatedKey<K>,
      fn: (
        x: Await<ReturnType<ReturnType<typeof wrap>['query'][K]>>
      ) => Await<ReturnType<ReturnType<typeof wrap>['query'][K]>>
    ) => {
      client.setQueryData<
        Await<ReturnType<ReturnType<typeof wrap>['query'][K]>>
      >(key, fn as any);
    },
    [client]
  );
};
