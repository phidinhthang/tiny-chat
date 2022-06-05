import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { useTokenStore } from '../../lib/useTokenStore';
import { useWsHandlerStore } from './useWsHandlerStore';

const API_URL = import.meta.env.VITE_API_URL;
const WEBSOCKET_URL = `${API_URL.replace('http', 'ws')}/ws`;

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketContext = React.createContext<{
  socket: ReconnectingWebSocket | null;
  setSocket: React.Dispatch<React.SetStateAction<ReconnectingWebSocket | null>>;
}>({ socket: null, setSocket: () => {} });

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const hasTokens = !!useTokenStore((s) => s.accessToken && s.refreshToken);
  const [socket, setSocket] = React.useState<ReconnectingWebSocket | null>(
    null
  );
  const navigate = useNavigate();
  const isConnecting = React.useRef(false);

  useEffect(() => {
    if (!socket && hasTokens && !isConnecting.current) {
      isConnecting.current = true;
      const socket = new ReconnectingWebSocket(WEBSOCKET_URL);
      socket.addEventListener('open', () => {
        const accessToken = useTokenStore.getState().accessToken;
        socket.send(JSON.stringify({ op: 'auth', d: accessToken }));
        isConnecting.current = false;
      });
      socket.addEventListener('close', (err) => {
        console.log('socket error ', err);
        socket.close();
        // useTokenStore
        //   .getState()
        //   .setTokens({ accessToken: '', refreshToken: '' });
      });
      socket.addEventListener('message', (rawMessage) => {
        const handlerMap = useWsHandlerStore.getState().handlerMap;
        let message: { op: string; d: any };
        try {
          if (typeof rawMessage.data !== 'string') {
            message = JSON.parse(rawMessage.data.toString());
          } else {
            message = JSON.parse(rawMessage.data);
          }
          if (message.op === 'auth-good') {
            console.log('auth-good', message);
            (window as any).socket = socket;
            setSocket(socket);
          }
          if (typeof handlerMap[message.op] !== 'undefined') {
            handlerMap[message.op](message.d);
          }
        } catch (err) {
          console.log('ws error ', err);
        }
      });
    }
  }, [hasTokens, socket, navigate]);

  return (
    <WebSocketContext.Provider
      value={React.useMemo(() => {
        return {
          socket,
          setSocket,
        };
      }, [socket, setSocket])}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
