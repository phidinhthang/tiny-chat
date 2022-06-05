import create from 'zustand';
import { combine } from 'zustand/middleware';

const accessTokenKey = 'access-token';
const refreshTokenKey = 'refresh-token';

export const getDefaultValues = () => {
  return {
    accessToken: localStorage.getItem(accessTokenKey) || '',
    refreshToken: localStorage.getItem(refreshTokenKey) || '',
  };
};

export const useTokenStore = create(
  combine(getDefaultValues(), (set) => ({
    setTokens: (x: { accessToken: string; refreshToken: string }) => {
      localStorage.setItem(accessTokenKey, x.accessToken);
      localStorage.setItem(refreshTokenKey, x.refreshToken);
      set(x);
    },
  }))
);
