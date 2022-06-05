import jwtDecode from 'jwt-decode';
import { useTokenStore } from './useTokenStore';
const baseUrl = import.meta.env.VITE_API_URL;

export type Fetcher = {
  query: (endpoint: string, init?: RequestInit) => Promise<any>;
  mutate: (endpoint: string, init?: RequestInit) => Promise<any>;
};

export const createFetcher = ({ url = baseUrl }: { url?: string }): Fetcher => {
  const refresh = async (): Promise<void> => {
    let { accessToken, refreshToken, setTokens } = useTokenStore.getState();
    if (!accessToken) return;
    let shouldRefresh = false;
    try {
      const { exp } = jwtDecode<{ exp: number }>(accessToken);
      if (exp * 1000 > Date.now()) return;
      shouldRefresh = true;
    } catch {
      shouldRefresh = true;
    }

    if (!shouldRefresh) return;

    const r = await fetch(`${url}/refresh-token`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('response headers ', r.headers);
    const d = await r.json();
    accessToken = d.accessToken;
    setTokens({ accessToken, refreshToken });
  };

  const fetcher: Fetcher = {
    query: async (endpoint, init) => {
      await refresh();
      const accessToken = useTokenStore.getState().accessToken;
      const r = await fetch(`${url}${endpoint}`, {
        headers: {
          'X-Access-Token': accessToken,
          ...(init?.headers || {}),
        },
      });
      let data: any;

      data = await r.json();
      if (r.status > 399) {
        return Promise.reject(data);
      }
      return data;
    },
    mutate: async (endpoint, init) => {
      await refresh();
      const accessToken = useTokenStore.getState().accessToken;
      const r = await fetch(`${url}${endpoint}`, {
        method: init?.method || 'POST',
        body: init?.body,
        headers: {
          'X-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      const data = await r.json();
      if (r.status > 399) return Promise.reject(data);
      return data;
    },
  };

  return fetcher;
};

export const fetcher = createFetcher({});
