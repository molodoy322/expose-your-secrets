import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { encodeFunctionData } from "viem";
import {
  GM_CONTRACT_ADDRESS,
  GM_ABI,
  getGmUserStats,
  getGmCheckInPrice,
  getGmCurrentTime,
  getGmCurrentDay,
  CHAIN_ID,
  MIN_TIME_BETWEEN_CHECKINS
} from "./lib/gmContract";
import { publicClient } from "./lib/contract";

interface GmTabProps {
  secrets: any[];
  onStreakUpdate?: (streak: number) => void;
}

interface UserGmStats {
  currentStreak: number;
  totalCheckIns: number;
  lastCheckIn: number;
  longestStreak: number;
  isActive: boolean;
}

// Расширяем глобальный интерфейс Window
declare global {
  interface Window {
    updateTimer?: NodeJS.Timeout;
  }
}

const checkIn = async () => {
  const [from] = await window.ethereum.request({ method: "eth_requestAccounts" });
  const chainId = "0x" + CHAIN_ID.toString(16);

  console.log("Switching to Base chain");
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId }],
  });

  const txData = encodeFunctionData({
    abi: GM_ABI,
    functionName: "checkIn",
    args: [BigInt(CHAIN_ID)],
  });

  console.log("Sending transaction...");
  const txHash = await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [{
      from,
      to: GM_CONTRACT_ADDRESS,
      value: "0x" + (20000000000000).toString(16),
      data: txData,
    }],
  });

  console.log("Transaction hash:", txHash);
  return txHash;
};

export default function GmTab({ secrets, onStreakUpdate }: GmTabProps) {
  const { address, isConnected } = useAccount();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState<null | "success" | "fail">(null);
  const [userStats, setUserStats] = useState<UserGmStats | null>(null);
  const [timeUntilNextCheckIn, setTimeUntilNextCheckIn] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  async function fetchUserStats() {
    if (!address) return;
    
    try {
      setLoading(true);
      const stats = await getGmUserStats(address, CHAIN_ID);
      setUserStats({
        currentStreak: Number(stats.currentStreak),
        totalCheckIns: Number(stats.totalCheckIns),
        lastCheckIn: Number(stats.lastCheckIn),
        longestStreak: Number(stats.longestStreak),
        isActive: stats.isActive
      });
      
      // Обновляем стрик в родительском компоненте
      if (onStreakUpdate) {
        onStreakUpdate(Number(stats.currentStreak));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setError('Failed to load user stats');
    } finally {
      setLoading(false);
    }
  }

  // Загружаем статистику при монтировании компонента
  useEffect(() => {
    fetchUserStats();
    
    // Добавляем обработчик события updateStreak
    const handleUpdateStreak = (event: CustomEvent) => {
      if (event.detail.address === address) {
        fetchUserStats();
      }
    };
    
    const gmTab = document.querySelector('[data-tab="gm"]');
    if (gmTab) {
      gmTab.addEventListener('updateStreak', handleUpdateStreak as EventListener);
    }
    
    return () => {
      if (gmTab) {
        gmTab.removeEventListener('updateStreak', handleUpdateStreak as EventListener);
      }
    };
  }, [address]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      // Очищаем все таймеры
      if (window.updateTimer) {
        clearInterval(window.updateTimer);
      }
      // Удаляем обработчик события
      window.removeEventListener('streakUpdate', handleUpdateStreak as EventListener);
    };
  }, []);

  // Оптимизируем обработчик обновления стрика
  const handleUpdateStreak = useCallback((event: CustomEvent) => {
    const newStreak = event.detail.streak;
    setUserStats(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        currentStreak: newStreak
      };
    });
    if (onStreakUpdate) {
      onStreakUpdate(newStreak);
    }
  }, [onStreakUpdate]);

  // Оптимизируем обновление таймера
  const updateTimer = useCallback(() => {
    if (!userStats?.lastCheckIn) return;

    const now = Math.floor(Date.now() / 1000);
    const timeSinceLastCheckIn = now - userStats.lastCheckIn;
    const timeUntilNextCheckIn = 24 * 60 * 60 - timeSinceLastCheckIn;

    if (timeUntilNextCheckIn <= 0) {
      setTimeUntilNextCheckIn(0);
    } else {
      setTimeUntilNextCheckIn(timeUntilNextCheckIn);
    }
  }, [userStats?.lastCheckIn]);

  // Устанавливаем таймер обновления
  useEffect(() => {
    updateTimer();
    window.updateTimer = setInterval(updateTimer, 1000);

    return () => {
      if (window.updateTimer) {
        clearInterval(window.updateTimer);
      }
    };
  }, [updateTimer]);

  const canCheckIn = () => {
    if (!userStats?.lastCheckIn) return true;
    return timeUntilNextCheckIn === 0;
  };

  // Оптимизируем обработчик чекина
  const handleCheckIn = useCallback(async () => {
    if (!canCheckIn()) return;

    try {
      setError(null);
      await checkIn();
      await fetchUserStats();
    } catch (error) {
      console.error('Error during check-in:', error);
      setError("Failed to check in. Please try again.");
    }
  }, [canCheckIn, fetchUserStats]);

  return (
    <motion.div
      data-tab="gm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        maxWidth: 720,
        margin: "0px auto 0",
        padding: "24px",
        background: "rgba(36, 58, 37, 0.33)",
        borderRadius: 26,
        border: "2px solid #21EF6E",
        boxShadow: "0 0 32px 0 #21ef6e15",
        backdropFilter: "blur(19px)",
        WebkitBackdropFilter: "blur(19px)",
        color: "#fff",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      {/* Daily Check-in Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          background: "rgba(34,36,58,0.66)",
          padding: "24px",
          borderRadius: 16,
          marginBottom: 24,
          border: "1px solid #21EF6E33"
        }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          style={{ fontSize: 24, color: "#21EF6E", fontWeight: 800, marginBottom: 16, textAlign: "center" }}
        >
          🌞 Daily Check-in
        </motion.div>
        <div style={{
          fontSize: 17,
          color: "#aaa",
          marginBottom: 24,
          lineHeight: 1.5
        }}>
          Check in every 23 hours to maintain your streak, earn rewards, and accumulate $SECRET tokens. The longer your streak, the more $SECRET you'll earn!
        </div>

        {/* Check-in Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCheckIn}
          disabled={!canCheckIn() || isCheckingIn}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: 18,
            fontWeight: 800,
            background: canCheckIn() ? "#0066FF" : "rgba(34,36,58,0.66)",
            color: "#fff",
            border: "none",
            borderRadius: 16,
            cursor: canCheckIn() ? "pointer" : "not-allowed",
            opacity: isCheckingIn ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: canCheckIn() ? "0 0 20px #0066FF44" : "none"
          }}
        >
          {isCheckingIn ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                🔄
              </motion.span>
              Processing...
            </>
          ) : canCheckIn() ? (
            <>🌞 Check In (BASE)</>
          ) : (
            <>⏳ {Math.floor(timeUntilNextCheckIn / 3600)}h {Math.floor((timeUntilNextCheckIn % 3600) / 60)}m</>
          )}
        </motion.button>

        {/* Status Messages */}
        <AnimatePresence>
          {checkinStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                color: "#21EF6E",
                fontWeight: 700,
                fontSize: 16,
                marginTop: 16,
                textAlign: "center"
              }}
            >
              ✅ Check-in successful!
            </motion.div>
          )}
          {checkinStatus === "fail" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                color: "#FF2D55",
                fontWeight: 700,
                fontSize: 16,
                marginTop: 16,
                textAlign: "center"
              }}
            >
              ❌ Transaction failed
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 24
        }}
      >
        {[
          { icon: "🔥", title: "Current Streak", value: userStats?.currentStreak ?? 0, color: "#21EF6E" },
          { icon: "🏆", title: "Best Streak", value: userStats?.longestStreak ?? 0, color: "#FFD600" },
          { icon: "📅", title: "Total", value: userStats?.totalCheckIns ?? 0, color: "#FF2D55" }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            style={{
              background: "rgba(34,36,58,0.66)",
              padding: "16px",
              borderRadius: 16,
              textAlign: "center",
              border: `1px solid ${stat.color}33`
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 14, color: stat.color, fontWeight: 700 }}>{stat.title}</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{loading ? "..." : stat.value}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* App Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        style={{
          background: "rgba(34,36,58,0.66)",
          padding: "20px",
          borderRadius: 16,
          marginBottom: 24,
          border: "1px solid #9056FF33"
        }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          style={{ fontSize: 18, color: "#9056FF", fontWeight: 700, marginBottom: 16, textAlign: "center" }}
        >
          📊 App Statistics
        </motion.div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16
        }}>
          {[
            { icon: "🤫", title: "Total Secrets", value: secrets.length, color: "#21EF6E" },
            { icon: "❤️", title: "Total Likes", value: secrets.reduce((sum, secret) => sum + Number(secret.likes), 0), color: "#FF2D55" }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              style={{
                background: "rgba(34,36,58,0.66)",
                padding: "16px",
                borderRadius: 16,
                textAlign: "center",
                border: `1px solid ${stat.color}33`
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontSize: 14, color: stat.color, fontWeight: 700 }}>{stat.title}</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{stat.value}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}