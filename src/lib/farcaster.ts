/// <reference types="vite/client" />

const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://expose-your-secrets.vercel.app';

export const farcasterConfig = {
  relay: 'https://relay.farcaster.xyz',
  rpcUrl: 'https://base-mainnet.infura.io/v3/9010eab5407747c68ac69b02ffee4255',
  domain: currentOrigin,
  siweUri: currentOrigin
}

let sdkInitialized = false;

export async function initializeFarcaster() {
  console.log('Initializing Farcaster SDK...');
  
  const isInIframe = window.self !== window.top;
  console.log('Running in iframe:', isInIframe);

  if (!isInIframe) {
    console.log('Not running in Farcaster iframe, skipping initialization');
    return;
  }

  try {
    // Даем время на загрузку SDK
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!window.frame?.sdk) {
      console.log('Farcaster SDK not found');
      return;
    }

    console.log('Farcaster SDK found, calling ready()...');
    await window.frame.sdk.ready();
    console.log('Farcaster SDK ready() called successfully');
    sdkInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Farcaster SDK:', error);
    // Не выбрасываем ошибку, чтобы приложение продолжало работать
  }
}

export async function shareToFarcaster(text: string, imageUrl?: string) {
  try {
    if (!sdkInitialized) {
      await initializeFarcaster();
    }

    if (!window.frame?.sdk?.actions?.post) {
      throw new Error('Farcaster SDK or actions not available for sharing');
    }

    const isInIframe = window.self !== window.top;
    if (!isInIframe && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.warn('Sharing outside of Farcaster iframe');
    }

    await window.frame.sdk.actions.post({
      title: "Expose Your Secrets",
      image: imageUrl || "https://expose-your-secrets.vercel.app/og.png",
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
  } catch (error) {
    console.error('Failed to share to Farcaster:', error);
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      alert("Шеринг в Farcaster работает только на публичном домене. При разработке на localhost эта функция недоступна.");
    } else {
      alert("Не удалось поделиться в Farcaster. Пожалуйста, попробуйте снова.");
    }
  }
} 