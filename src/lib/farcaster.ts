import { AuthKitConfig } from '@farcaster/auth-kit'

export const farcasterConfig: AuthKitConfig = {
  relay: 'https://relay.farcaster.xyz',
  rpcUrl: 'https://base-mainnet.infura.io/v3/9010eab5407747c68ac69b02ffee4255',
  domain: 'expose-your-secrets.vercel.app',
  siweUri: 'https://expose-your-secrets.vercel.app'
}

export async function initializeFarcaster() {
  try {
    if (window.frame && window.frame.sdk) {
      window.frame.sdk.ready();
      console.log('Farcaster SDK is ready');
    }
    console.log('Farcaster initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Farcaster:', error);
  }
}

export async function shareToFarcaster(text: string, imageUrl?: string) {
  try {
    if (window.frame && window.frame.sdk && window.frame.sdk.actions) {
      await window.frame.sdk.actions.post({
        title: "Expose Your Secrets",
        image: imageUrl || "https://placehold.co/900x600.png?text=Secret+Shared",
        buttons: [
          {
            label: "View Secret",
            action: "post_redirect",
            target: "https://expose-your-secrets.vercel.app"
          }
        ],
        postUrl: "https://expose-your-secrets.vercel.app",
        input: {
          text: text
        }
      });
      console.log('Successfully shared to Farcaster');
    } else {
      console.warn('Farcaster SDK or actions not available for sharing.');
      // Fallback for development or environments without Farcaster Frame context
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        alert("Шеринг в Farcaster работает только на публичном домене. При разработке на localhost эта функция недоступна.");
      } else {
        alert("Не удалось поделиться в Farcaster. Пожалуйста, попробуйте снова.");
      }
    }
  } catch (error) {
    console.error('Failed to share to Farcaster:', error);
    alert("Не удалось поделиться в Farcaster. Пожалуйста, попробуйте снова.");
  }
} 