import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wagmi'
import { AuthKitProvider } from '@farcaster/auth-kit'
import { farcasterConfig } from './lib/farcaster'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthKitProvider config={farcasterConfig}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
