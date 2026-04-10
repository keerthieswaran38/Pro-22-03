import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { gagnerTheme } from '../shared/theme';
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

// Root Rendering
const rootElement = document.getElementById('user-app-root') || document.getElementById('root');
console.log('[DEBUG] Gagner Sports Booting... Root Element Found:', rootElement);

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
} else {
    console.error('[CRITICAL] No root element found in DOM! Check your index.html.');
}
