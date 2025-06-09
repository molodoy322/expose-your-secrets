import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserStats } from "./lib/contract";
import { shareToFarcaster } from './lib/farcaster';
import { useThrottle } from './lib/hooks';





const btnStyle: React.CSSProperties = {
  marginTop: 10,
  padding: "10px 30px",
  borderRadius: 11,
  background: "#161616",
  color: "#fff",
  border: "2px solid #21EF6E",
  fontWeight: 600,
  fontSize: 17,
  boxShadow: "0 0 10px #21ef6e55",
  cursor: "pointer",
  transition: "background 0.2s, box-shadow 0.2s, border 0.2s",
  outline: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  backdropFilter: "blur(5px)",
  WebkitBackdropFilter: "blur(5px)"
};

interface HomeTabProps {
  address?: string;
  isConnected: boolean;
  connect: any;
  connectors: any;
  disconnect: any;
  secret: string;
  boostLikes: (id: number) => void;
  setSecret: (s: string) => void;
  secrets: any[];
  prevSecrets?: any[];
  loading: boolean;
  info: string;
  submitSecret: () => void;
  likeSecret: (id: number) => void;
  isAdmin: boolean;
  deleteSecret: (id: number) => void;
  cardStyle: React.CSSProperties;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  refetchSecrets: () => void;
}

// --- DiceBear аватар по адресу (детерміновано) ---
function getAvatarUrl(address: string | undefined) {
  if (!address) return "https://api.dicebear.com/9.x/pixel-art/svg?seed=anon";
  return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${address.toLowerCase()}`;
}

// --- Крипто-нікнейм по адресу (детерміновано) ---
const nickWords = [
  "Crypto", "Anon", "Ghost", "Hodler", "Fantom", "Satoshi", "ZK", "Chain", "Bit", "Tiger", "Wolf", "DeFi", "Shark", "APE", "Vault", "Stealth", "PX", "Byte", "Hex", "Hash", "Liquid", "Night", "Dark", "Sig", "Seed", "Ledger", "Pool", "Mint", "Sigma", "Slayer", "Beast", "Zen", "Flip", "Bot"
];
function getAnonNick(address: string | undefined) {
  if (!address) return "AnonGhost";
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash |= 0;
  }
  const w1 = nickWords[Math.abs(hash) % nickWords.length];
  const w2 = nickWords[Math.abs((hash*17)) % nickWords.length];
  const num = Math.abs(hash) % 10000;
  return `${w1}${w2}${num}`;
}

// --- Кешування статистики користувача ---
function getCachedStats(address: string) {
  const raw = localStorage.getItem('stats_' + address);
  if (!raw) return null;
  try {
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < 5 * 60 * 1000) return data;
    return null;
  } catch { return null; }
}
function setCachedStats(address: string, data: {secretsPosted: number, likesGiven: number}) {
  localStorage.setItem('stats_' + address, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
}

export default function HomeTab({
  address,
  isConnected,
  connect,
  connectors,
  disconnect,
  secret,
  setSecret,
  secrets,
  prevSecrets = [],
  loading,
  isAdmin,
  deleteSecret,
  submitSecret,
  likeSecret,
  boostLikes,
  cardStyle,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetchSecrets,
  info,
}: HomeTabProps) {

  // Додаєш тут
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const postsToday = secrets.filter(
    (s: any) =>
      s.author?.toLowerCase() === address?.toLowerCase() &&
      Number(s.timestamp) * 1000 >= todayStart.getTime()
  ).length;

  const likesToday = 0; // залиш на 0 якщо нема timestamp на лайках

    // --- User stats state ---
const [, setUserStats] = React.useState<{secretsPosted: number, likesGiven: number}>({ secretsPosted: 0, likesGiven: 0 });

  // Мемоизируем фильтрацию секретов
  const latestSecrets = useMemo(() => 
    secrets.filter(s => !s.deleted).slice(0, 10),
    [secrets]
  );

  const topSecrets = useMemo(() => 
    [...secrets].filter(s => !s.deleted)
      .sort((a, b) => Number(b.likes) - Number(a.likes))
      .slice(0, 10),
    [secrets]
  );

  // Мемоизируем функцию SecretCard
  const SecretCardMemo = useCallback((s: any, isMine: boolean, isMotion = true) => {
    return SecretCard(s, isMine, isMotion);
  }, [likeSecret, boostLikes, deleteSecret, isAdmin]);

  // Оптимизируем обработчик скролла
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
      setTimeout(() => {
        fetchNextPage();
      }, 300);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    
    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1
    };

    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver(handleIntersection, options);

    if (lastSecretRef.current) {
      observer.current.observe(lastSecretRef.current);
    }

    return () => { 
      if (observer.current) observer.current.disconnect(); 
    };
  }, [hasNextPage, isFetchingNextPage, handleIntersection]);

  // ---- disabled логіка ----
  const submitDisabled = !isConnected || loading || !secret.trim();

  // --- Blur pop animation: фіксуємо новий секрет ---
  const prevIdsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (prevSecrets) {
      prevIdsRef.current = new Set(prevSecrets.map((s: any) => s.id));
    }
  }, [prevSecrets]);

  const newSecretId =
    latestSecrets.length > 0 &&
    !prevIdsRef.current.has(latestSecrets[0].id)
      ? latestSecrets[0].id
      : null;

  // ---- Glow для своїх секретів ----
  function getMyStyle(isMine: boolean) {
    return isMine
      ? {
          border: "2.5px solid #FFD600",
          boxShadow: "0 0 18px 3px #ffd60099, 0 0 0px 0px #FFD600",
          animation: "unicorn-glow 2.3s linear infinite",
          position: "relative",
        }
      : {};
  }

  // --- Секрет-картка: для Latest i Top ---
  function SecretCard(s: any, isMine: boolean, isMotion = true) {
    return (
      <>
        {/* --- Аватар + нік у правому верхньому куті --- */}
        <div style={{
          position: "absolute",
          top: 11,
          right: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
          zIndex: 9,
          background: "rgba(34,34,50,0.82)",
          borderRadius: 8,
          padding: "3.5px 12px 3.5px 6px",
          boxShadow: "0 2px 10px #0002"
        }}>
          <img 
            src={getAvatarUrl(s.author)} 
            alt="avatar" 
            style={{width: "24px", height: "24px", borderRadius: 6, background: "#23243a", border: "2px solid #23243a"}}
            loading="lazy"
          />
          <span style={{
            fontWeight:700,
            fontSize:16,
            color:"#fff",
            letterSpacing:0.3,
            opacity:0.92,
            whiteSpace:'nowrap'
          }}>
            {getAnonNick(s.author)}
          </span>
        </div>
        {/* --- Єдиноріг тільки для своїх секретів --- */}
        {isMine && (
          <motion.span
            initial={{ scale: 0.6, rotate: -10, filter: "blur(2px)" }}
            animate={{ scale: 1.15, rotate: [10, -10, 10], filter: "blur(0px)" }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            style={{
              position: "absolute",
              top: 10,
              left: 16,
              fontSize: 32,
              filter: "drop-shadow(0 0 9px #FFD600)",
              pointerEvents: "none",
              userSelect: "none"
            }}
            title="This is your secret"
          >🦄</motion.span>
        )}
        {/* --- Сам секрет --- */}
        <div style={{
          fontStyle: "italic",
          fontSize: 20,
          marginBottom: 7,
          marginTop: 28,
          letterSpacing: "0.4px",
          textAlign: "center"
        }}>{s.text}</div>
        {/* --- Like + лайки (завжди внизу) --- */}
        <div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginTop: "auto",
  paddingTop: 14,
  borderTop: "1px solid #333",
  paddingBottom: 6,
  paddingLeft: 16,
  paddingRight: 16,
}}>
  <button
    onClick={() => likeSecret(s.id)}
    disabled={!isConnected || loading}
    style={{
      background: "#181A20",
      border: isMine ? "2px solid #FFD600" : (cardStyle.border || "2px solid #21EF6E"),
      padding: "6px 16px",
      fontSize: 15,
      borderRadius: 11,
      color: "#fff",
      fontWeight: 600,
      cursor: "pointer",
      minWidth: 66,
      marginRight: 6
    }}
  >
    👍 Like
  </button>

  <button
    onClick={() => boostLikes(s.id)}
    disabled={!isConnected || loading}
    style={{
      background: "linear-gradient(90deg,#FFD600,#FF2D55)",
      color: "#23243a",
      fontWeight: 800,
      border: "none",
      borderRadius: 14,
      fontSize: 15,
      padding: "6px 20px",
      boxShadow: "0 0 8px 2px #FFD60055",
      margin: "0 10px",
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.66 : 1,
      transition: "box-shadow 0.2s",
      outline: "none"
    }}
    title="Super Like = +100 Likes (0.0001 ETH)"
  >
    🚀 Super Like (100)
  </button>

  <span style={{
    fontSize: 17,
    fontWeight: "bold",
    color: isMine ? "#FFD600" : (cardStyle.color || "#21EF6E"),
    letterSpacing: 0.2,
    whiteSpace: 'nowrap',
    marginLeft: 12
  }}>
    ❤️ {Number(s.likes)} Likes
  </span>

{/* --- КНОПКА ВИДАЛИТИ ДЛЯ АДМІНА --- */}
        {isAdmin && (
          <button
            onClick={() => deleteSecret && deleteSecret(s.id)}
            style={{
              marginLeft: 14,
              background: "#FF2D55",
              color: "#fff",
              border: "none",
              borderRadius: 9,
              fontWeight: 700,
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: 14,
              boxShadow: "0 0 8px 2px #FF2D5555"
            }}
          >
            Видалити
          </button>
        )}
      </div>
      </>
    );
  }

  // --- Стан для спіннера refresh ---
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetchSecrets();
    setTimeout(() => setIsRefreshing(false), 600); // невелика затримка для UX
  }

  // --- Infinite scroll refs ---
  const observer = useRef<IntersectionObserver | null>(null);
  const lastSecretRef = useRef<HTMLLIElement | null>(null);

  const throttledFetchNextPage = useThrottle((fetchNextPage: () => void) => {
    fetchNextPage();
  }, 1000);

  // --- Додаємо стейт для табів ---
  const [activeTab, setActiveTab] = useState<'latest' | 'top'>('latest');
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  // --- Слідкуємо за розміром екрану ---
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-[420px] mx-auto px-4">
      {/* Логотип */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <span className="text-3xl font-bold bg-gradient-to-r from-[#21EF6E] to-[#FF2D55] bg-clip-text text-transparent">
          Expose Your Secrets
        </span>
      </div>

      {/* Форма для секрета */}
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4 text-center">Share your secret</h2>
        
        <textarea
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Write your secret here..."
          className="w-full min-h-[120px] p-4 rounded-xl bg-[#181A20] border border-[#21EF6E33] text-white mb-4 focus:outline-none focus:border-[#21EF6E] transition-all duration-200"
        />

        <button
          onClick={submitSecret}
          disabled={submitDisabled}
          className="w-full h-12 rounded-xl font-bold text-lg bg-gradient-to-r from-[#21EF6E] to-[#FF2D55] text-white shadow-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Post Secret (0.00001 ETH)
        </button>
      </div>

      {/* Список секретов */}
      <div className="w-full mt-8">
        <AnimatePresence>
          {latestSecrets.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              ref={idx === latestSecrets.length - 1 ? lastSecretRef : null}
            >
              {SecretCardMemo(s, s.author?.toLowerCase() === address?.toLowerCase())}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
