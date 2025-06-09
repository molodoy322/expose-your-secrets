import { sdk } from '@farcaster/frame-sdk';

export async function initializeFarcaster() {
  try {
    // Отключаем нативные жесты, чтобы пользователи не могли случайно закрыть приложение
    await sdk.actions.ready({ disableNativeGestures: true });
    console.log('Farcaster SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Farcaster SDK:', error);
  }
}

export async function shareToFarcaster(text: string, imageUrl?: string) {
  try {
    if (!window.frame) {
      console.error('Farcaster SDK not available');
      return;
    }

    await window.frame.post({
      text,
      embeds: imageUrl ? [{ url: imageUrl }] : []
    });
    
    console.log('Successfully shared to Farcaster');
  } catch (error) {
    console.error('Failed to share to Farcaster:', error);
  }
} 