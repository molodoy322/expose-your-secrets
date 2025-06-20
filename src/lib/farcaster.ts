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
      return;
    }

    // Если SDK еще не загружен, создаем скрипт
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@farcaster/frame-sdk/dist/index.min.js';
    script.async = true;

    script.onload = async () => {
      if (window.sdk?.actions?.ready) {
        await window.sdk.actions.ready();
        sdkInitialized = true;
      }
    };

    script.onerror = () => {
      sdkLoading = false;
    };

    document.head.appendChild(script);
  } catch (error) {
    sdkLoading = false;
  }
}

export async function initializeFarcaster() {
  try {
    await loadSDK();
  } catch (error) {
  }
}

export async function shareToFarcaster(text: string, imageUrl?: string) {
  if (!sdkInitialized) {
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
      return false;
    }
  } catch (error) {
    return false;
  }
} 