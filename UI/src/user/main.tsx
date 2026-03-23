import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserApp from './App';

// Shared QueryClient for cache management
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60000, 
            retry: 2
        }
    }
});

import { ConfigProvider } from 'antd';
import { gagnerTheme } from '../shared/theme';

// Root Rendering
const rootElement = document.getElementById('user-app-root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <ConfigProvider theme={gagnerTheme}>
                    <UserApp />
                </ConfigProvider>
            </QueryClientProvider>
        </React.StrictMode>
    );
}
