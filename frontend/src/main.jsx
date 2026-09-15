import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './i18n/config' // Initialize i18n
import './styles/index.css'
import './styles/subpages.css'

const __originalToLocaleString = Number.prototype.toLocaleString
Number.prototype.toLocaleString = function (locales, options) {
  const nextOptions =
    options && typeof options === 'object' ? { ...options, useGrouping: false } : { useGrouping: false }
  return __originalToLocaleString.call(this, locales, nextOptions)
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#2C3E3A',
                color: '#fff',
                borderRadius: '16px',
                boxShadow: '0 12px 32px rgba(44, 62, 58, 0.16)',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#6B8E6F',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
