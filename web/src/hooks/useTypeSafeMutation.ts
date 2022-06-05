import { wrap } from '../lib/wrapper';
import { useMutation, UseMutationOptions } from 'react-query';
import { Await } from '../util-types';
import { fetcher } from '../lib/fetcher';

type MutationKey = keyof ReturnType<typeof wrap>['mutation'];

export const useTypeSafeMutation = <
  K extends MutationKey,
  TData = Await<ReturnType<ReturnType<typeof wrap>['mutation'][K]>>,
  TError = unknown
>(
  key: K,
  options?: UseMutationOptions<
    TData,
    TError,
    Parameters<ReturnType<typeof wrap>['mutation'][K]>,
    any
  >
) => {
  return useMutation<
    TData,
    TError,
    Parameters<ReturnType<typeof wrap>['mutation'][K]>
  >((params) => {
    return (wrap(fetcher).mutation[key] as any)(...params);
  }, options);
};
