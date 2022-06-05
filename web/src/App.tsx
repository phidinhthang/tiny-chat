import * as React from 'react';
import { ReactQueryDevtools } from 'react-query/devtools';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { MainWsHandlerProvider } from './modules/ws/useMainWsHandler';
import { WebSocketProvider } from './modules/ws/WebSocketProvider';
import { Routers } from './Routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      refetchOnMount: false,
      staleTime: Infinity,
    },
  },
});

export const CountContext = React.createContext(0);

function App() {
  const [count, setCount] = React.useState(0);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <WebSocketProvider>
          <MainWsHandlerProvider>
            <CountContext.Provider value={count}>
              <Routers />
            </CountContext.Provider>
          </MainWsHandlerProvider>
        </WebSocketProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
