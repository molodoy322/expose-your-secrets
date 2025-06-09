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

// Функция для проверки загрузки скрипта SDK
function isSDKScriptLoaded(): boolean {
  return document.querySelector('script[src*="frame-sdk"]') !== null;
}

// Функция для ожидания загрузки скрипта
function waitForSDKScript(): Promise<void> {
  return new Promise((resolve) => {
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
      resolve();
    }, 5000);
  });
}

export async function initializeFarcaster() {
  console.log('Initializing Farcaster SDK...');
  
  const isInIframe = window.self !== window.top;
  console.log('Running in iframe:', isInIframe);

  if (!isInIframe) {
    console.log('Not running in Farcaster iframe, skipping initialization');
    return;
  }

  // Ждем загрузки скрипта SDK
  await waitForSDKScript();
  console.log('SDK script loaded');

  const waitForSDK = () => {
    return new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30; // Увеличиваем количество попыток
      const interval = 200; // Уменьшаем интервал

      const checkSDK = () => {
        attempts++;
        console.log(`Checking for Farcaster SDK (attempt ${attempts}/${maxAttempts})...`);

        if (window.frame?.sdk) {
          console.log('Farcaster SDK found');
          
          // Проверяем наличие всех необходимых методов
          if (typeof window.frame.sdk.ready === 'function' && 
              window.frame.sdk.actions && 
              typeof window.frame.sdk.actions.post === 'function') {
            console.log('Farcaster SDK fully initialized');
            sdkInitialized = true;
            resolve();
          } else {
            console.log('Waiting for Farcaster SDK methods...');
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
    
    // Дополнительная проверка после инициализации
    if (window.frame?.sdk?.ready) {
      try {
        await window.frame.sdk.ready();
        console.log('Farcaster SDK ready method called successfully');
      } catch (error) {
        console.warn('Error calling Farcaster SDK ready method:', error);
      }
    }
    
    if (window.frame?.sdk?.actions) {
      console.log('Farcaster SDK actions available');
    } else {
      console.warn('Farcaster SDK actions not available');
    }
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