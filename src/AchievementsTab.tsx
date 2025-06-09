import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { ACHIEVEMENT_NFT_ADDRESS, ACHIEVEMENT_NFT_ABI } from './lib/achievementNFT';
import { Category, Level } from './lib/achievementNFT';
import { 
  hasMintedAchievement,
  ACHIEVEMENT_REQUIREMENTS,
  getMintPrice,
  getAchievementInfo
} from './lib/achievementNFT';

const baseChain = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
    public: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://basescan.org' },
  },
} as const;

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  isCompleted: boolean;
  reward: string;
  nftImage?: string;
  category: string;
  level: Level;
}

interface AchievementCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  achievements: Achievement[];
}

interface AchievementsTabProps {
  address?: string;
  totalLikesGiven: number;
  totalPosts: number;
  totalLikesReceived: number;
  streak: number;
}

// Обновляем данные достижений с правильными требованиями
const achievementsData: AchievementCategory[] = [
  {
    id: "likes",
    title: "Like Master",
    description: "Give likes to other secrets",
    icon: "👍",
    achievements: [
      { id: "like_1", title: "First Like", description: "Give your first like", icon: "👍", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.LIKE_MASTER][Level.I], isCompleted: false, reward: "Like Master I NFT", category: "likes", level: Level.I },
      { id: "like_5", title: "Like Enthusiast", description: "Give 5 likes", icon: "👍", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.LIKE_MASTER][Level.II], isCompleted: false, reward: "Like Master II NFT", category: "likes", level: Level.II },
      { id: "like_10", title: "Like Pro", description: "Give 10 likes", icon: "👍", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.LIKE_MASTER][Level.III], isCompleted: false, reward: "Like Master III NFT", category: "likes", level: Level.III },
      { id: "like_50", title: "Like Expert", description: "Give 50 likes", icon: "👍", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.LIKE_MASTER][Level.IV], isCompleted: false, reward: "Like Master IV NFT", category: "likes", level: Level.IV },
      { id: "like_100", title: "Like Legend", description: "Give 100 likes", icon: "👍", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.LIKE_MASTER][Level.V], isCompleted: false, reward: "Like Master V NFT", category: "likes", level: Level.V },
    ]
  },
  {
    id: "posts",
    title: "Secret Creator",
    description: "Share your secrets with the world",
    icon: "🤫",
    achievements: [
      { id: "post_1", title: "First Secret", description: "Share your first secret", icon: "🤫", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.SECRET_CREATOR][Level.I], isCompleted: false, reward: "Creator I NFT", category: "posts", level: Level.I },
      { id: "post_3", title: "Secret Explorer", description: "Share 3 secrets", icon: "🤫", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.SECRET_CREATOR][Level.II], isCompleted: false, reward: "Creator II NFT", category: "posts", level: Level.II },
      { id: "post_5", title: "Secret Artist", description: "Share 5 secrets", icon: "🤫", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.SECRET_CREATOR][Level.III], isCompleted: false, reward: "Creator III NFT", category: "posts", level: Level.III },
      { id: "post_10", title: "Secret Master", description: "Share 10 secrets", icon: "🤫", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.SECRET_CREATOR][Level.IV], isCompleted: false, reward: "Creator IV NFT", category: "posts", level: Level.IV },
      { id: "post_25", title: "Secret Legend", description: "Share 25 secrets", icon: "🤫", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.SECRET_CREATOR][Level.V], isCompleted: false, reward: "Creator V NFT", category: "posts", level: Level.V },
      { id: "post_50", title: "Secret God", description: "Share 50 secrets", icon: "🤫", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.SECRET_CREATOR][Level.VI], isCompleted: false, reward: "Creator VI NFT", category: "posts", level: Level.VI },
      { id: "post_100", title: "Secret Deity", description: "Share 100 secrets", icon: "🤫", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.SECRET_CREATOR][Level.VII], isCompleted: false, reward: "Creator VII NFT", category: "posts", level: Level.VII },
    ]
  },
  {
    id: "popular",
    title: "Popular Secrets",
    description: "Get likes on your secrets",
    icon: "❤️",
    achievements: [
      { id: "received_5", title: "Getting Started", description: "Get 5 likes on your secrets", icon: "❤️", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.POPULAR_SECRETS][Level.I], isCompleted: false, reward: "Popular I NFT", category: "popular", level: Level.I },
      { id: "received_10", title: "Rising Star", description: "Get 10 likes on your secrets", icon: "❤️", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.POPULAR_SECRETS][Level.II], isCompleted: false, reward: "Popular II NFT", category: "popular", level: Level.II },
      { id: "received_15", title: "Secret Sensation", description: "Get 15 likes on your secrets", icon: "❤️", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.POPULAR_SECRETS][Level.III], isCompleted: false, reward: "Popular III NFT", category: "popular", level: Level.III },
      { id: "received_35", title: "Secret Star", description: "Get 35 likes on your secrets", icon: "❤️", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.POPULAR_SECRETS][Level.IV], isCompleted: false, reward: "Popular IV NFT", category: "popular", level: Level.IV },
      { id: "received_50", title: "Secret Legend", description: "Get 50 likes on your secrets", icon: "❤️", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.POPULAR_SECRETS][Level.V], isCompleted: false, reward: "Popular V NFT", category: "popular", level: Level.V },
      { id: "received_100", title: "Secret Deity", description: "Get 100 likes on your secrets", icon: "❤️", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.POPULAR_SECRETS][Level.VI], isCompleted: false, reward: "Popular VI NFT", category: "popular", level: Level.VI },
    ]
  },
  {
    id: "streak",
    title: "Daily Streak",
    description: "Maintain your daily check-in streak",
    icon: "🔥",
    achievements: [
      { id: "streak_3", title: "Getting Started", description: "3 day streak", icon: "🔥", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.DAILY_STREAK][Level.I], isCompleted: false, reward: "Streak I NFT", category: "streak", level: Level.I },
      { id: "streak_7", title: "Week Warrior", description: "7 day streak", icon: "🔥", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.DAILY_STREAK][Level.II], isCompleted: false, reward: "Streak II NFT", category: "streak", level: Level.II },
      { id: "streak_14", title: "Fortnight Fighter", description: "14 day streak", icon: "🔥", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.DAILY_STREAK][Level.III], isCompleted: false, reward: "Streak III NFT", category: "streak", level: Level.III },
      { id: "streak_30", title: "Monthly Master", description: "30 day streak", icon: "🔥", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.DAILY_STREAK][Level.IV], isCompleted: false, reward: "Streak IV NFT", category: "streak", level: Level.IV },
      { id: "streak_100", title: "Century Champion", description: "100 day streak", icon: "🔥", progress: 0, total: ACHIEVEMENT_REQUIREMENTS[Category.DAILY_STREAK][Level.V], isCompleted: false, reward: "Streak V NFT", category: "streak", level: Level.V },
    ]
  }
];

export default function AchievementsTab({ 
  address,
  totalLikesGiven,
  totalPosts,
  totalLikesReceived,
  streak
}: AchievementsTabProps) {

  const [activeCategory, setActiveCategory] = useState<string>("likes");
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [newlyCompleted, setNewlyCompleted] = useState<string[]>([]);
  const [mintingAchievement, setMintingAchievement] = useState<string | null>(null);
  const [mintedAchievements, setMintedAchievements] = useState<Set<string>>(new Set());
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<AchievementCategory[]>(achievementsData);
  const [selectedCategory, setSelectedCategory] = useState<string>('like-master');
  const [mintPrice, setMintPrice] = useState<bigint>(BigInt(0));
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isTransactionPending } = useWaitForTransactionReceipt({
    hash
  });

  // Получаем цену минтинга при загрузке
  useEffect(() => {
    const fetchMintPrice = async () => {
      const price = await getMintPrice();
      setMintPrice(price);
    };
    fetchMintPrice();
  }, []);

  // Функция для проверки заминченных достижений
  const checkMintedAchievements = async () => {
    if (!address) return;

    try {
      const categories = [
        { id: 'likes', enum: Category.LIKE_MASTER },
        { id: 'posts', enum: Category.SECRET_CREATOR },
        { id: 'popular', enum: Category.POPULAR_SECRETS },
        { id: 'streak', enum: Category.DAILY_STREAK }
      ];

      const updatedAchievements = [...achievements];

      for (const category of categories) {
        const levels = Object.values(Level).filter(v => typeof v === 'number') as Level[];
        for (const level of levels) {
          const isMinted = await hasMintedAchievement(address, category.enum, level);
          if (isMinted) {
            const categoryIndex = updatedAchievements.findIndex(cat => cat.id === category.id);
            if (categoryIndex !== -1) {
              const achievementIndex = updatedAchievements[categoryIndex].achievements.findIndex(
                achievement => achievement.level === level
              );
              if (achievementIndex !== -1) {
                updatedAchievements[categoryIndex].achievements[achievementIndex] = {
                  ...updatedAchievements[categoryIndex].achievements[achievementIndex],
                  isCompleted: true
                };
              }
            }
          }
        }
      }

      setAchievements(updatedAchievements);
    } catch (error) {
      console.error('Error checking minted achievements:', error);
      setError("Failed to check minted achievements");
    }
  };

  // Мемоизируем обновление прогресса достижений
  const updateAchievementsProgress = useCallback(() => {
    setAchievements(prev => prev.map(category => {
      const updatedAchievements = category.achievements.map(achievement => {
        let progress = 0;
        switch (category.id) {
          case 'likes':
            progress = totalLikesGiven;
            break;
          case 'posts':
            progress = totalPosts;
            break;
          case 'popular':
            progress = totalLikesReceived;
            break;
          case 'streak':
            progress = streak;
            break;
        }
        return {
          ...achievement,
          progress,
          isCompleted: progress >= achievement.total
        };
      });
      return { ...category, achievements: updatedAchievements };
    }));
  }, [totalLikesGiven, totalPosts, totalLikesReceived, streak]);

  // Мемоизируем статистику достижений
  const achievementsStats = useMemo(() => {
    const total = achievements.reduce((acc, cat) => acc + cat.achievements.length, 0);
    const completed = achievements.reduce((acc, cat) => 
      acc + cat.achievements.filter(a => a.isCompleted).length, 0
    );
    const percentage = Math.round((completed / total) * 100);
    return { total, completed, percentage };
  }, [achievements]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      // Очищаем все состояния
      setShowShareModal(false);
      setSelectedAchievement(null);
      setNewlyCompleted([]);
      setMintingAchievement(null);
      setError(null);
    };
  }, []);

  // Оптимизируем обработчик минтинга
  const handleMintAchievement = useCallback(async (achievement: Achievement) => {
    if (!address || !isConnected) return;
    
    if (chainId !== 8453) {
      setError("Please switch to Base network to mint achievements");
      return;
    }

    try {
      setIsMinting(true);
      setMintingAchievement(achievement.id);
      setError(null); // Очищаем предыдущие ошибки
      
      const categoryEnum = getCategoryEnum(achievement.category);
      const levelEnum = getLevelEnum(achievement.level);
      
      await writeContract({
        address: ACHIEVEMENT_NFT_ADDRESS,
        abi: ACHIEVEMENT_NFT_ABI,
        functionName: 'mintAchievement',
        args: [
          address as `0x${string}`,
          categoryEnum,
          levelEnum,
          achievement.title,
          achievement.description,
          BigInt(achievement.total)
        ],
        value: mintPrice,
        account: address as `0x${string}`,
        chain: baseChain
      });
    } catch (error) {
      console.error('Error minting achievement:', error);
      setError("Failed to mint achievement. Please try again.");
    } finally {
      setIsMinting(false);
      setMintingAchievement(null);
    }
  }, [address, isConnected, chainId, writeContract, mintPrice]);

  // Вспомогательные функции для конвертации категорий и уровней
  const getCategoryEnum = (category: string): Category => {
    switch (category) {
      case 'likes': return Category.LIKE_MASTER;
      case 'posts': return Category.SECRET_CREATOR;
      case 'popular': return Category.POPULAR_SECRETS;
      case 'streak': return Category.DAILY_STREAK;
      default: return Category.LIKE_MASTER;
    }
  };

  const getLevelEnum = (level: Level): Level => {
    return level;
  };

  // Обновляем прогресс достижений на основе реальных данных
  useEffect(() => {
    if (!address) return;

    const updateAchievementsProgress = () => {
      setAchievements(prev => prev.map(category => {
        const updatedAchievements = category.achievements.map(achievement => {
          let progress = 0;
          switch (category.id) {
            case 'likes':
              progress = totalLikesGiven;
              break;
            case 'posts':
              progress = totalPosts;
              break;
            case 'popular':
              progress = totalLikesReceived;
              break;
            case 'streak':
              progress = streak;
              break;
          }
          return {
            ...achievement,
            progress,
            isCompleted: progress >= achievement.total
          };
        });
        return { ...category, achievements: updatedAchievements };
      }));
    };

    updateAchievementsProgress();
    checkMintedAchievements();
  }, [address, totalLikesGiven, totalPosts, totalLikesReceived, streak]);

  // Статистика по всем достижениям
  const totalAchievements = achievements.reduce((acc, cat) => acc + cat.achievements.length, 0);
  const completedAchievements = achievements.reduce((acc, cat) => 
    acc + cat.achievements.filter(a => a.isCompleted).length, 0
  );
  const completionPercentage = Math.round((completedAchievements / totalAchievements) * 100);

  // Функция для шаринга в Farcaster
  const shareToFarcaster = async (achievement: Achievement) => {
    if (!window.frame || !window.frame.sdk || !window.frame.sdk.actions) return;
    
    try {
      await window.frame.sdk.actions.post({
        text: `🎉 I just earned the "${achievement.title}" achievement in Expose Your Secrets!\n\n${achievement.description}\n\nReward: ${achievement.reward}`,
        image: achievement.nftImage || "https://expose-your-secrets.vercel.app/og.png"
      });
    } catch (error) {
      console.error('Failed to share to Farcaster:', error);
    }
  };

  // Мемоизируем обработчик изменения категории
  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, []);

  const activeCategoryData = achievements.find(cat => cat.id === activeCategory);

  // Оптимизируем обработчик обновления
  const handleRefresh = useCallback(async () => {
    if (!address) return;
    
    try {
      setError(null); // Очищаем предыдущие ошибки
      
      // Создаем копию текущих достижений
      const updatedAchievements = [...achievements];
      
      // Обновляем прогресс для каждой категории
      updatedAchievements.forEach(category => {
        category.achievements.forEach(achievement => {
          let progress = 0;
          switch (category.id) {
            case 'likes':
              progress = totalLikesGiven;
              break;
            case 'posts':
              progress = totalPosts;
              break;
            case 'popular':
              progress = totalLikesReceived;
              break;
            case 'streak':
              progress = streak;
              break;
          }
          achievement.progress = progress;
          achievement.isCompleted = progress >= achievement.total;
        });
      });

      // Обновляем состояние с новыми значениями
      setAchievements(updatedAchievements);

      // Проверяем заминченные достижения
      await checkMintedAchievements();
    } catch (error) {
      console.error('Error refreshing achievements:', error);
      setError("Failed to refresh achievements");
    }
  }, [address, achievements, totalLikesGiven, totalPosts, totalLikesReceived, streak, checkMintedAchievements]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        maxWidth: 720,
        margin: "60px auto 0 auto",
        padding: "36px 28px 42px 28px",
        background: "rgba(36, 58, 37, 0.33)",
        borderRadius: 26,
        border: "2px solid #21EF6E",
        boxShadow: "0 0 32px 0 #21ef6e15, 0 0 0 4px #FFD60009",
        backdropFilter: "blur(19px)",
        WebkitBackdropFilter: "blur(19px)",
        textAlign: "center",
        color: "#fff",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            background: "rgba(255, 45, 85, 0.1)",
            border: "1px solid #FF2D55",
            borderRadius: 12,
            padding: "12px 20px",
            marginBottom: 20,
            color: "#FF2D55",
            fontSize: 14,
            fontWeight: 600
          }}
        >
          {error}
        </motion.div>
      )}

      {/* Общая статистика */}
      <div style={{
        background: "rgba(34,36,58,0.66)",
        borderRadius: 16,
        padding: "20px",
        marginBottom: 30,
        border: "1px solid #21EF6E33"
      }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#FFD600",
          marginBottom: 12
        }}>
          Overall Progress
        </h3>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10
        }}>
          <span style={{ color: "#aaa" }}>Completed: {completedAchievements}/{totalAchievements}</span>
          <span style={{ color: "#21EF6E", fontWeight: 700 }}>{completionPercentage}%</span>
        </div>
        <div style={{
          background: "#181A20",
          height: 8,
          borderRadius: 4,
          overflow: "hidden"
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #21EF6E, #FFD600)",
              borderRadius: 4
            }}
          />
        </div>
      </div>

      <div style={{
        fontSize: 36, fontWeight: 900, color: "#FFD600", marginBottom: 8,
        letterSpacing: 1.1, textShadow: "0 0 14px #FFD60055",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px"
      }}>
        🏆 Achievements
        <motion.button
          onClick={handleRefresh}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: "rgba(33, 239, 110, 0.1)",
            border: "2px solid #21EF6E",
            color: "#21EF6E",
            padding: "8px 16px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          Refresh
        </motion.button>
      </div>
      <div style={{
        fontSize: 21,
        fontWeight: 700,
        color: "#fff",
        marginBottom: 13,
        textShadow: "0 0 8px #21EF6E"
      }}>
        Complete challenges to earn unique NFTs and $SECRET tokens. The more achievements you unlock, the more $SECRET rewards you'll receive!
      </div>

      {/* Category Tabs */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 12,
        marginBottom: 30,
        flexWrap: "wrap"
      }}>
        {achievements.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: activeCategory === category.id 
                ? "linear-gradient(90deg, #21EF6E, #FFD600)"
                : "rgba(34,36,58,0.66)",
              color: activeCategory === category.id ? "#23243a" : "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 20px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
              boxShadow: activeCategory === category.id 
                ? "0 0 15px 2px #21ef6e44"
                : "none"
            }}
          >
            <span style={{ fontSize: 20 }}>{category.icon}</span>
            {category.title}
          </motion.button>
        ))}
      </div>

      {/* Active Category Content */}
      <AnimatePresence mode="wait">
        {activeCategoryData && (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#21EF6E",
              marginBottom: 16,
              textShadow: "0 0 8px #21EF6E55"
            }}>
              {activeCategoryData.icon} {activeCategoryData.title}
            </h3>
            <p style={{
              fontSize: 16,
              color: "#aaa",
              marginBottom: 20
            }}>
              {activeCategoryData.description}
            </p>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
              marginBottom: 20
            }}>
              {activeCategoryData.achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    background: achievement.isCompleted 
                      ? "linear-gradient(140deg, #23243a 70%, #1a1b22 100%)"
                      : "rgba(34,36,58,0.66)",
                    borderRadius: 16,
                    border: achievement.isCompleted 
                      ? "2px solid #21EF6E"
                      : "2px solid #333",
                    padding: 20,
                    textAlign: "left",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: achievement.isCompleted 
                      ? "0 0 20px 2px #21ef6e33"
                      : "none"
                  }}
                >
                  <div style={{
                    fontSize: 24,
                    marginBottom: 8
                  }}>
                    {achievement.icon}
                  </div>
                  <h4 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: achievement.isCompleted ? "#21EF6E" : "#fff"
                  }}>
                    {achievement.title}
                  </h4>
                  <p style={{
                    fontSize: 14,
                    color: "#aaa",
                    marginBottom: 12
                  }}>
                    {achievement.description}
                  </p>
                  <div style={{
                    background: "#181A20",
                    height: 6,
                    borderRadius: 3,
                    marginBottom: 8,
                    overflow: "hidden"
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      style={{
                        height: "100%",
                        background: achievement.isCompleted 
                          ? "linear-gradient(90deg, #21EF6E, #FFD600)"
                          : "#21EF6E"
                      }}
                    />
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "#888"
                  }}>
                    <span>Progress: {achievement.progress}/{achievement.total}</span>
                    <span>Reward: {achievement.reward}</span>
                  </div>
                  {achievement.isCompleted && (
                    <>
                      <div style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        color: "#21EF6E",
                        fontSize: 20
                      }}>
                        ✅
                      </div>
                      {!mintedAchievements.has(achievement.id) ? (
                        <button
                          onClick={() => handleMintAchievement(achievement)}
                          disabled={isMinting}
                          style={{
                            position: "absolute",
                            bottom: 10,
                            right: 10,
                            background: isMinting ? "#666" : "#21EF6E",
                            border: "none",
                            color: "#23243a",
                            cursor: isMinting ? "wait" : "pointer",
                            fontSize: 14,
                            padding: "8px 16px",
                            borderRadius: 8,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                          }}
                        >
                          {isMinting ? (
                            <>
                              <span style={{ animation: "spin360 1s linear infinite" }}>🔄</span>
                              Minting...
                            </>
                          ) : (
                            <>
                              <span>🎨</span>
                              Mint NFT (0.001 ETH)
                            </>
                          )}
                        </button>
                      ) : (
                        <div style={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          color: "#21EF6E",
                          fontSize: 14,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 8
                        }}>
                          <span>🎨</span>
                          NFT Minted
                        </div>
                      )}
                    </>
                  )}
                  {newlyCompleted.includes(achievement.id) && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(33, 239, 110, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 40
                      }}
                    >
                      🎉
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: "#23243a",
                padding: 30,
                borderRadius: 20,
                maxWidth: 400,
                width: "90%",
                textAlign: "center"
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#FFD600",
                marginBottom: 20
              }}>
                Share Achievement
              </h3>
              <p style={{
                fontSize: 16,
                color: "#fff",
                marginBottom: 20
              }}>
                Share your achievement "{selectedAchievement.title}" on Farcaster?
              </p>
              <div style={{
                display: "flex",
                gap: 10,
                justifyContent: "center"
              }}>
                <button
                  onClick={() => setShowShareModal(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#333",
                    border: "none",
                    borderRadius: 10,
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    shareToFarcaster(selectedAchievement);
                    setShowShareModal(false);
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "#21EF6E",
                    border: "none",
                    borderRadius: 10,
                    color: "#23243a",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Share
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 