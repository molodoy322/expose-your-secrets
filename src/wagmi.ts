import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame as miniAppConnector } from "@farcaster/frame-wagmi-connector";

// Використовуємо тільки mainnet Base!
export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    miniAppConnector()
  ]
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
