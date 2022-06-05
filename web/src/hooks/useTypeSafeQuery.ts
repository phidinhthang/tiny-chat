import { useQuery, UseQueryOptions } from 'react-query';
import { wrap } from '../lib/wrapper';
import { fetcher } from '../lib/fetcher';
import { Await } from '../util-types';

type QueryKey = keyof ReturnType<typeof wrap>['query'];
type PaginatedKey<K extends QueryKey> = [K, ...(string | number | boolean)[]];

export const useTypeSafeQuery = <
  K extends QueryKey,
  TData = Await<ReturnType<ReturnType<typeof wrap>['query'][K]>>,
  TError = unknown
>(
  key: K | PaginatedKey<K>,
  options: UseQueryOptions<TData, TError> = {},
  params?: Parameters<ReturnType<typeof wrap>['query'][K]>
) => {
  return useQuery<TData, TError>(
    key,
    () => {
      const fn = wrap(fetcher).query[
        typeof key === 'string' ? key : key[0]
      ] as any;
      return fn(...(params || [])) as any;
    },
    { ...options }
  );
};
