import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// ABI для контракта NFT
export const ACHIEVEMENT_NFT_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "category", "type": "uint8"},
      {"name": "level", "type": "uint8"},
      {"name": "title", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "requiredProgress", "type": "uint256"}
    ],
    "name": "mintAchievement",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "user", "type": "address"},
      {"name": "category", "type": "uint8"},
      {"name": "level", "type": "uint8"}
    ],
    "name": "hasMinted",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "getAchievement",
    "outputs": [
      {"name": "category", "type": "uint8"},
      {"name": "level", "type": "uint8"},
      {"name": "title", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "timestamp", "type": "uint256"},
      {"name": "requiredProgress", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MINT_PRICE",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Адрес контракта NFT
export const ACHIEVEMENT_NFT_ADDRESS = '0x92F89FE122790F91785Be211e26d78F19780847F' as `0x${string}`;

// Создаем публичный клиент для чтения данных контракта
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

// Категории достижений
export enum Category {
  LIKE_MASTER = 0,
  SECRET_CREATOR = 1,
  POPULAR_SECRETS = 2,
  DAILY_STREAK = 3
}

// Уровни достижений
export enum Level {
  I = 0,
  II = 1,
  III = 2,
  IV = 3,
  V = 4,
  VI = 5,
  VII = 6
}

// Функция для проверки, заминчено ли достижение
export async function hasMintedAchievement(
  userAddress: string,
  category: Category,
  level: Level
): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: ACHIEVEMENT_NFT_ADDRESS,
      abi: ACHIEVEMENT_NFT_ABI,
      functionName: 'hasMinted',
      args: [userAddress as `0x${string}`, category, level]
    });
    return result as boolean;
  } catch (error) {
    console.error('Error checking minted achievement:', error);
    return false;
  }
}

// Функция для получения информации о достижении
export async function getAchievementInfo(tokenId: number) {
  try {
    const result = await publicClient.readContract({
      address: ACHIEVEMENT_NFT_ADDRESS,
      abi: ACHIEVEMENT_NFT_ABI,
      functionName: 'getAchievement',
      args: [BigInt(tokenId)]
    });
    return result;
  } catch (error) {
    console.error('Error getting achievement info:', error);
    return null;
  }
}

// Функция для получения цены минтинга
export async function getMintPrice(): Promise<bigint> {
  try {
    const result = await publicClient.readContract({
      address: ACHIEVEMENT_NFT_ADDRESS,
      abi: ACHIEVEMENT_NFT_ABI,
      functionName: 'MINT_PRICE'
    });
    return result as bigint;
  } catch (error) {
    console.error('Error getting mint price:', error);
    return BigInt(0);
  }
}

// Константы для прогресса достижений
export const ACHIEVEMENT_REQUIREMENTS = {
  [Category.LIKE_MASTER]: {
    [Level.I]: 1,
    [Level.II]: 5,
    [Level.III]: 10,
    [Level.IV]: 50,
    [Level.V]: 100
  },
  [Category.SECRET_CREATOR]: {
    [Level.I]: 1,
    [Level.II]: 3,
    [Level.III]: 5,
    [Level.IV]: 10,
    [Level.V]: 25,
    [Level.VI]: 50,
    [Level.VII]: 100
  },
  [Category.POPULAR_SECRETS]: {
    [Level.I]: 5,
    [Level.II]: 10,
    [Level.III]: 15,
    [Level.IV]: 35,
    [Level.V]: 50,
    [Level.VI]: 100
  },
  [Category.DAILY_STREAK]: {
    [Level.I]: 3,
    [Level.II]: 7,
    [Level.III]: 14,
    [Level.IV]: 30,
    [Level.V]: 100
  }
}; 