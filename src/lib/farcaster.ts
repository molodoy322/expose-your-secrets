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
  if (sdkInitialized) return;

  try {
    // Ждем загрузки SDK
    if (typeof window !== 'undefined' && !window.frame?.sdk) {
      await new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 секунд максимум
        
        const checkSDK = () => {
          if (window.frame?.sdk) {
            resolve(true);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkSDK, 100);
          } else {
            console.warn('Farcaster SDK not loaded after timeout');
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
        } else {
          console.warn('Farcaster SDK ready method not available');
        }
      } catch (error) {
        console.error('Error during Farcaster SDK ready:', error);
      }
      sdkInitialized = true;
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

    if (window.frame?.sdk?.actions?.post) {
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
    } else {
      console.warn('Farcaster SDK or actions not available for sharing');
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