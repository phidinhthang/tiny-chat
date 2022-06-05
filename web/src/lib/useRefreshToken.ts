import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTokenStore } from './useTokenStore';
import { useTypeSafeMutation } from '../hooks/useTypeSafeMutation';
import { useTypeSafeQuery } from '../hooks/useTypeSafeQuery';

export const useRefreshToken = () => {
  const { mutate, isLoading } = useTypeSafeMutation('refreshToken');
  const [enabledMeQuery, setEnabledMeQuery] = React.useState(false);
  useTypeSafeQuery('me', { enabled: enabledMeQuery });
  const setTokens = useTokenStore((s) => s.setTokens);
  const refreshToken = useTokenStore((s) => s.refreshToken);
  const navigate = useNavigate();
  React.useEffect(() => {
    mutate([{ refreshToken }], {
      onSuccess: (data) => {
        setEnabledMeQuery(true);
        setTokens({ accessToken: data.accessToken, refreshToken });
      },
      onError: () => {
        navigate('/login');
      },
    });
  }, [mutate]);

  return { isLoading };
};
