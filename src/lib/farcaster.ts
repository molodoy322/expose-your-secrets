/// <reference types="vite/client" />

const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://expose-your-secrets.vercel.app';

export const farcasterConfig = {
  relay: 'https://relay.farcaster.xyz',
  rpcUrl: 'https://base-mainnet.infura.io/v3/9010eab5407747c68ac69b02ffee4255',
  domain: currentOrigin,
  siweUri: currentOrigin
}

let sdkInitialized = false;
let sdkLoading = false;

async function loadSDK(): Promise<void> {
  if (sdkLoading) return;
  sdkLoading = true;

  try {
    // Проверяем, доступен ли уже SDK
    if (window.sdk?.actions?.ready) {
      console.log('Farcaster SDK already loaded');
      await window.sdk.actions.ready();
      sdkInitialized = true;
      return;
    }

    // Если SDK еще не загружен, создаем скрипт
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@farcaster/frame-sdk/dist/index.min.js';
    script.async = true;

    script.onload = async () => {
      console.log('Farcaster SDK script loaded');
      if (window.sdk?.actions?.ready) {
        await window.sdk.actions.ready();
        sdkInitialized = true;
      }
    };

    script.onerror = (error) => {
      console.error('Failed to load Farcaster SDK:', error);
      sdkLoading = false;
    };

    document.head.appendChild(script);
  } catch (error) {
    console.error('Error in loadSDK:', error);
    sdkLoading = false;
  }
}

export async function initializeFarcaster() {
  console.log('Initializing Farcaster SDK...');
  console.log('Is in iframe:', window.self !== window.top);
  
  try {
    await loadSDK();
  } catch (error) {
    console.error('Failed to initialize Farcaster SDK:', error);
  }
}

export async function shareToFarcaster(text: string, imageUrl?: string) {
  if (!sdkInitialized) {
    console.log('Farcaster SDK not initialized, attempting to initialize...');
    await initializeFarcaster();
  }

  try {
    if (window.sdk?.actions?.post) {
      await window.sdk.actions.post({
        text,
        image: imageUrl,
      });
      return true;
    } else {
      console.error('Farcaster SDK post method not available');
      return false;
    }
  } catch (error) {
    console.error('Error sharing to Farcaster:', error);
    return false;
  }
} 