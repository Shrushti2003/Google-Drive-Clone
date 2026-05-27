import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReactLenis } from 'lenis/react';
import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';
import { AuthQuerySync } from './components/routing/AuthQuerySync.jsx';
import { queryClient } from './config/queryClient.js';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { router } from './router.jsx';
import './styles/global.css';

const app = (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthQuerySync />
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            background: 'rgba(12, 18, 27, 0.88)',
            color: '#E8F7FF',
            border: '1px solid rgba(103, 232, 249, 0.16)',
            backdropFilter: 'blur(18px)'
          }
        }}
      />
    </QueryClientProvider>
  </ThemeProvider>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReactLenis root options={{ lerp: 0.08, wheelMultiplier: 0.9 }}>
      {app}
    </ReactLenis>
  </React.StrictMode>
);
