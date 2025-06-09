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
  
  if (typeof window === 'undefined') {
    console.warn('Farcaster SDK: Window is not defined');
    return;
  }

  const isInIframe = window.self !== window.top;
  console.log('Running in iframe:', isInIframe);

  if (!isInIframe) {
    console.log('Not running in iframe, skipping Farcaster SDK initialization');
    return;
  }

  let initializationAttempts = 0;
  const MAX_INIT_ATTEMPTS = 10;
  const INIT_DELAY = 500;

  const waitForSDK = () => {
    return new Promise<void>((resolve, reject) => {
      const checkSDK = () => {
        initializationAttempts++;
        console.log(`Checking for Farcaster SDK (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})...`);

        if (window.frame?.sdk) {
          console.log('Farcaster SDK found');
          resolve();
        } else if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
          console.warn('Farcaster SDK not found after maximum attempts');
          reject(new Error('Farcaster SDK not found'));
        } else {
          setTimeout(checkSDK, INIT_DELAY);
        }
      };
      checkSDK();
    });
  };

  try {
    await waitForSDK();
    
    if (window.frame?.sdk?.ready) {
      console.log('Calling Farcaster SDK ready method...');
      await window.frame.sdk.ready();
      console.log('Farcaster SDK initialized successfully');
    } else {
      console.warn('Farcaster SDK ready method not available');
    }

    if (window.frame?.sdk?.actions) {
      console.log('Farcaster SDK actions available');
    } else {
      console.warn('Farcaster SDK actions not available');
    }
  } catch (error) {
    console.error('Error initializing Farcaster SDK:', error);
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