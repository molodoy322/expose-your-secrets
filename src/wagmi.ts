import { http } from 'viem'
import { base } from 'viem/chains'
import { createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { QueryClient } from '@tanstack/react-query'

// Ініціалізуємо QueryClient
export const queryClient = new QueryClient()

// Створюємо конфігурацію wagmi
export const config = createConfig({
  chains: [base],
  connectors: [injected()],
  transports: {
    [base.id]: http('https://base-mainnet.infura.io/v3/9010eab5407747c68ac69b02ffee4255'),
  },
})

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
