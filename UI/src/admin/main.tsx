import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { gagnerTheme } from '../shared/theme';
import { BrowserRouter } from 'react-router-dom';
import AdminApp from './App';
import '../styles/admin.css';

const queryClient = new QueryClient();

const rootElement = document.getElementById('admin-app-root') || document.getElementById('admin-root') || document.getElementById('root');
console.log('[DEBUG] Admin Booting... Root Found:', rootElement);
if (!rootElement) console.error('[CRITICAL] Admin Root Element not found in DOM!');

const root = ReactDOM.createRoot(rootElement as HTMLElement);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={gagnerTheme}>
        <BrowserRouter basename="/admin">
          <AdminApp />
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
