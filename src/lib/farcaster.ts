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
  if (sdkInitialized) {
    console.log('Farcaster SDK already initialized');
    return;
  }

  if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
    console.warn('Max initialization attempts reached');
    return;
  }

  initializationAttempts++;

  try {
    // Проверяем, находимся ли мы в iframe
    const isInIframe = window.self !== window.top;
    console.log('Running in iframe:', isInIframe);

    // Ждем загрузки SDK с таймаутом
    if (typeof window !== 'undefined' && !window.frame?.sdk) {
      await new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 секунд максимум
        const timeout = setTimeout(() => {
          console.warn('Farcaster SDK loading timeout');
          resolve(false);
        }, 5000);
        
        const checkSDK = () => {
          if (window.frame?.sdk) {
            clearTimeout(timeout);
            resolve(true);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkSDK, 100);
          } else {
            clearTimeout(timeout);
            console.warn('Farcaster SDK not loaded after attempts');
            resolve(false);
          }
        };
        checkSDK();
      });
    }

    // Инициализируем SDK
    if (window.frame?.sdk) {
      try {
        if (typeof window.frame.sdk.ready === 'function') {
          await window.frame.sdk.ready();
          console.log('Farcaster SDK initialized successfully');
          sdkInitialized = true;
        } else {
          console.warn('Farcaster SDK ready method not available');
          // Проверяем наличие других методов SDK
          if (window.frame.sdk.actions) {
            console.log('Farcaster SDK actions available');
            sdkInitialized = true;
          }
        }
      } catch (error) {
        console.error('Error during Farcaster SDK ready:', error);
        // Проверяем, можем ли мы продолжить без ready
        if (window.frame.sdk.actions) {
          console.log('Continuing without ready method');
          sdkInitialized = true;
        }
      }
    } else {
      console.warn('Farcaster SDK not available');
      sdkInitialized = true; // Продолжаем работу даже без SDK
    }
  } catch (error) {
    console.error('Failed to initialize Farcaster:', error);
    sdkInitialized = true; // Продолжаем работу даже при ошибке
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