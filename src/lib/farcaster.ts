/// <reference types="vite/client" />

const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://expose-your-secrets.vercel.app';

export const farcasterConfig = {
  relay: 'https://relay.farcaster.xyz',
  rpcUrl: 'https://base-mainnet.infura.io/v3/9010eab5407747c68ac69b02ffee4255',
  domain: currentOrigin,
  siweUri: currentOrigin
}

let sdkInitialized = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

export async function initializeFarcaster() {
  console.log('Initializing Farcaster SDK...');
  
  const isInIframe = window.self !== window.top;
  console.log('Running in iframe:', isInIframe);

  if (!isInIframe) {
    console.log('Not running in Farcaster iframe, skipping initialization');
    return;
  }

  const waitForSDK = () => {
    return new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;
      const interval = 250;

      const checkSDK = () => {
        attempts++;
        console.log(`Checking for Farcaster SDK (attempt ${attempts}/${maxAttempts})...`);

        if (window.frame?.sdk) {
          console.log('Farcaster SDK found');
          if (typeof window.frame.sdk.ready === 'function') {
            console.log('Farcaster SDK ready method available');
            resolve();
          } else {
            console.log('Farcaster SDK ready method not available');
            if (attempts >= maxAttempts) {
              reject(new Error('Farcaster SDK ready method not available after maximum attempts'));
            } else {
              setTimeout(checkSDK, interval);
            }
          }
        } else {
          console.log('Farcaster SDK not found');
          if (attempts >= maxAttempts) {
            reject(new Error('Farcaster SDK not found after maximum attempts'));
          } else {
            setTimeout(checkSDK, interval);
          }
        }
      };

      checkSDK();
    });
  };

  try {
    await waitForSDK();
    console.log('Farcaster SDK initialized successfully');
    
    if (window.frame?.sdk?.actions) {
      console.log('Farcaster SDK actions available');
    } else {
      console.warn('Farcaster SDK actions not available');
    }
  } catch (error) {
    console.error('Failed to initialize Farcaster SDK:', error);
  }
}

export async function shareToFarcaster(text: string, imageUrl?: string) {
  try {
    if (!sdkInitialized) {
      await initializeFarcaster();
    }

    // Проверяем все необходимые условия
    if (!window.frame?.sdk?.actions?.post) {
      throw new Error('Farcaster SDK or actions not available for sharing');
    }

    // Проверяем, что мы в правильном контексте
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