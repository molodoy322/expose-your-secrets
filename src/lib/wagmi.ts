import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector'

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http('https://base-mainnet.infura.io/v3/9010eab5407747c68ac69b02ffee4255'),
  },
  connectors: [
    miniAppConnector()
  ]
}) 