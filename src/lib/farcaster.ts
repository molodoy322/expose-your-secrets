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
const MAX_INIT_ATTEMPTS = 30;
const INIT_INTERVAL = 200;

// Функция для проверки загрузки скрипта SDK
function isSDKScriptLoaded(): boolean {
  return document.querySelector('script[src*="frame-sdk"]') !== null;
}

// Функция для ожидания загрузки скрипта
function waitForSDKScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isSDKScriptLoaded()) {
      resolve();
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      if (isSDKScriptLoaded()) {
        obs.disconnect();
        resolve();
      }
    });

    observer.observe(document.head, {
      childList: true,
      subtree: true
    });

    // Таймаут на случай, если скрипт не загрузится
    setTimeout(() => {
      observer.disconnect();
      reject(new Error('SDK script not loaded after timeout'));
    }, 10000);
  });
}

// Функция для проверки доступности методов SDK
function checkSDKMethods(): boolean {
  return (
    typeof window.frame?.sdk?.ready === 'function' &&
    window.frame?.sdk?.actions &&
    typeof window.frame.sdk.actions.post === 'function'
  );
}

export async function initializeFarcaster() {
  console.log('Initializing Farcaster SDK...');
  
  const isInIframe = window.self !== window.top;
  console.log('Running in iframe:', isInIframe);

  if (!isInIframe) {
    console.log('Not running in Farcaster iframe, skipping initialization');
    return;
  }

  try {
    // Ждем загрузки скрипта SDK
    await waitForSDKScript();
    console.log('SDK script loaded');

    // Ждем инициализации SDK
    let attempts = 0;
    while (attempts < MAX_INIT_ATTEMPTS) {
      attempts++;
      console.log(`Checking for Farcaster SDK (attempt ${attempts}/${MAX_INIT_ATTEMPTS})...`);

      if (window.frame?.sdk) {
        console.log('Farcaster SDK found');
        
        if (checkSDKMethods()) {
          console.log('Farcaster SDK methods available');
          
          try {
            await window.frame.sdk.ready();
            console.log('Farcaster SDK ready method called successfully');
            sdkInitialized = true;
            return;
          } catch (error) {
            console.warn('Error calling Farcaster SDK ready method:', error);
          }
        } else {
          console.log('Waiting for Farcaster SDK methods...');
        }
      } else {
        console.log('Farcaster SDK not found');
      }

      await new Promise(resolve => setTimeout(resolve, INIT_INTERVAL));
    }

    throw new Error('Farcaster SDK methods not available after maximum attempts');
  } catch (error) {
    console.error('Failed to initialize Farcaster SDK:', error);
    throw error;
  }
}

export async function shareToFarcaster(text: string, imageUrl?: string) {
  try {
    if (!sdkInitialized) {
      await initializeFarcaster();
    }

    if (!checkSDKMethods()) {
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