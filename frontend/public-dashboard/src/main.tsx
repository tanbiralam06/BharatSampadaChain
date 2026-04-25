import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GuestProvider } from './context/GuestProvider';
import { AppRoutes } from './router';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <GuestProvider>
          <AppRoutes />
        </GuestProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
