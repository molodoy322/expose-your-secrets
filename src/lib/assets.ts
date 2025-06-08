import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Кэш для аватаров
const avatarCache: Map<string, string> = new Map();

// Функция для получения URL аватара
export const getAvatarUrl = (address: string | undefined): string => {
  if (!address) {
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
  }

  // Проверяем кэш
  const cachedUrl = avatarCache.get(address);
  if (cachedUrl) {
    return cachedUrl;
  }

  // Генерируем новый URL
  const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`;
  
  // Сохраняем в кэш
  avatarCache.set(address, url);
  
  // Предзагружаем изображение
  const img = new Image();
  img.src = url;
  
  return url;
};

// Функция для предзагрузки аватаров
export const preloadAvatars = (addresses: string[]) => {
  addresses.forEach(address => {
    if (address) {
      getAvatarUrl(address);
    }
  });
};

// Функция для очистки кэша аватаров
export const clearAvatarCache = () => {
  avatarCache.clear();
}; 