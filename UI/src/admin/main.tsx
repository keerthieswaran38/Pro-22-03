import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { gagnerTheme } from '../shared/theme';
import AdminApp from './App';
import '../styles/admin.css';

const root = ReactDOM.createRoot(
  document.getElementById('admin-root') as HTMLElement
);

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={gagnerTheme}>
        <AdminApp />
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
