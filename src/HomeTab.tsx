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
  const [activeTab, setActiveTab] = useState<'latest' | 'top'>('latest');
  const observer = useRef<IntersectionObserver | null>(null);
  const lastSecretRef = useRef<HTMLDivElement | null>(null);

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
  function getMyStyle(isMine: boolean): React.CSSProperties {
    return isMine
      ? {
          border: "2.5px solid #FFD600",
          boxShadow: "0 0 18px 3px #ffd60099, 0 0 0px 0px #FFD600",
          animation: "unicorn-glow 2.3s linear infinite",
          position: "relative" as const,
        }
      : {};
  }

  // --- Секрет-картка: для Latest i Top ---
  function SecretCard(s: any, isMine: boolean, isMotion = true) {
    const Card = isMotion ? motion.div : 'div';
    
    return (
      <Card
        className="flex flex-col w-full bg-gray-900 rounded-lg p-4 mb-3"
        style={{
          ...getMyStyle(isMine),
          borderColor: isMine ? "#FFD600" : (cardStyle.border as string || "2px solid #21EF6E")
        } as React.CSSProperties}
      >
        {/* Текст секрету */}
        <div className="text-base italic mb-4">
          {s.text}
        </div>

        {/* Нижняя часть с аватаром, именем и кнопками */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => likeSecret(s.id)}
              disabled={!isConnected || loading}
              className="bg-[#181A20] border-2 px-4 py-1.5 rounded-lg text-sm font-semibold text-white min-w-[66px]"
              style={{
                borderColor: isMine ? "#FFD600" : (cardStyle.border as string || "2px solid #21EF6E")
              }}
            >
              👍 Like
            </button>

            <button
              onClick={() => boostLikes(s.id)}
              disabled={!isConnected || loading}
              className="bg-gradient-to-r from-[#FFD600] to-[#FF2D55] text-[#23243a] font-extrabold rounded-xl px-5 py-1.5 text-sm shadow-lg hover:shadow-xl transition-all duration-200"
              title="Super Like = +100 Likes (0.0001 ETH)"
            >
              🚀 Super Like (100)
            </button>

            <span className="text-base font-bold whitespace-nowrap"
              style={{
                color: isMine ? "#FFD600" : (cardStyle.color || "#21EF6E")
              }}>
              ❤️ {Number(s.likes)} Likes
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => deleteSecret && deleteSecret(s.id)}
                className="bg-[#FF2D55] text-white rounded-lg px-3.5 py-1.5 text-sm font-bold shadow-lg"
              >
                Видалити
              </button>
            )}
            <span className="font-bold text-base truncate">
              {getAnonNick(s.author)}
            </span>
            <img 
              src={getAvatarUrl(s.author)} 
              alt="avatar" 
              className="w-10 h-10 rounded-lg"
              loading="lazy"
            />
          </div>
        </div>
      </Card>
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
  const throttledFetchNextPage = useThrottle((fetchNextPage: () => void) => {
    fetchNextPage();
  }, 1000);

  // --- Слідкуємо за розміром екрану ---
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
  <div className="flex flex-col items-center w-full max-w-[420px] mx-auto px-4" style={{ gap: "16px" }}>
    {/* ЛОГО */}
    <div className="flex items-center justify-center w-full gap-2 mt-2 mb-1">
      <span style={{ fontSize: 32 }}>🔥</span>
      <h1
        className="text-3xl font-extrabold text-center"
        style={{
          background: "linear-gradient(90deg, #21EF6E, #FF2D55)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 800,
          letterSpacing: "1px",
        }}
      >
        Expose Your Secrets
      </h1>
      <span style={{ fontSize: 32 }}>🔥</span>
    </div>

    {/* КНОПКА WALLET — завжди показується! */}
    <button
      onClick={() => {
        if (!isConnected) connect({ connector: connectors[0] });
      }}
      style={{
        width: 170,
        height: 38,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 15,
        borderRadius: 14,
        background: isConnected
          ? 'linear-gradient(90deg, #333 0%, #666 100%)'
          : 'linear-gradient(90deg, #21EF6E 0%, #FF2D55 100%)',
        color: '#fff',
        border: 'none',
        boxShadow: isConnected
          ? '0 1px 6px #3336'
          : '0 1px 8px #21ef6e66',
        opacity: isConnected ? 0.82 : 1,
        cursor: isConnected ? 'default' : 'pointer',
        margin: '4px 0',
        transition: 'all 0.18s'
      }}
      disabled={isConnected}
    >
      {isConnected && address
        ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="16" height="16" style={{ marginRight: 4 }}>
              <circle cx="8" cy="8" r="8" fill="#21EF6E" />
            </svg>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        )
        : "Connect Wallet"}
    </button>

    {/* ПІДПИС "Share Anonymously" */}
    <div className="w-full mb-1 mt-2 text-center font-bold text-base text-gray-200 tracking-wide">
     🦾 Your Truth, On-Chain & Uncensored
    </div>

    {/* ФОРМА ДОДАВАННЯ СЕКРЕТУ */}
    <div className="w-full" style={{ marginTop: 0 }}>
      <textarea
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        placeholder="Share your secret..."
        style={{
          width: "100%",
          minHeight: "100px",
          padding: "12px",
          borderRadius: "11px",
          background: "#161616",
          color: "#fff",
          border: "2px solid #21EF6E",
          fontSize: "16px",
          resize: "none",
          outline: "none",
          boxShadow: "0 0 10px #21ef6e55",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)"
        }}
      />
      <button
        onClick={submitSecret}
        disabled={submitDisabled}
        style={{
          ...btnStyle,
          marginTop: "8px",
          opacity: submitDisabled ? 0.5 : 1,
          cursor: submitDisabled ? "not-allowed" : "pointer",
          width: "100%",
          justifyContent: "center"
        }}
      >
        {loading ? "Posting..." : "Post Secret"}
      </button>
    </div>

    {/* Інфо, таби, секрети — залишаєш як було */}
    {info && (
      <div style={{
        padding: "12px",
        borderRadius: "11px",
        background: "#161616",
        color: "#fff",
        border: "2px solid #21EF6E",
        fontSize: "14px",
        textAlign: "center"
      }}>
        {info}
      </div>
    )}

    {/* Tab switcher — ФІРМОВИЙ, НЕ КВАДРАТНИКИ! */}
<div style={{
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  margin: '12px 0 4px 0'
}}>
  <div style={{
    display: 'flex',
    width: '100%',
    maxWidth: 340,
    background: '#23243a',
    padding: 4,
    borderRadius: 999,
    boxShadow: '0 2px 16px #181A20'
  }}>
    <button
      onClick={() => setActiveTab('latest')}
      style={{
        flex: 1,
        height: 44,
        fontWeight: 600,
        fontSize: 18,
        borderRadius: 999,
        border: 'none',
        outline: 'none',
        marginRight: 2,
        background: activeTab === 'latest'
          ? 'linear-gradient(90deg, #21EF6E 0%, #FF2D55 100%)'
          : 'transparent',
        color: activeTab === 'latest' ? '#fff' : '#aaa',
        boxShadow: activeTab === 'latest' ? '0 0 12px #21ef6e55' : 'none',
        transition: 'all 0.22s',
        transform: activeTab === 'latest' ? 'scale(1.05)' : 'scale(1)'
      }}
    >
      Latest
    </button>
    <button
      onClick={() => setActiveTab('top')}
      style={{
        flex: 1,
        height: 44,
        fontWeight: 600,
        fontSize: 18,
        borderRadius: 999,
        border: 'none',
        outline: 'none',
        marginLeft: 2,
        background: activeTab === 'top'
          ? 'linear-gradient(90deg, #21EF6E 0%, #FF2D55 100%)'
          : 'transparent',
        color: activeTab === 'top' ? '#fff' : '#aaa',
        boxShadow: activeTab === 'top' ? '0 0 12px #21ef6e55' : 'none',
        transition: 'all 0.22s',
        transform: activeTab === 'top' ? 'scale(1.05)' : 'scale(1)'
      }}
    >
      Top
    </button>
  </div>
</div>


    {/* Secrets list */}
    <div className="w-full space-y-4">
      <AnimatePresence mode="popLayout">
        {(activeTab === 'latest' ? latestSecrets : topSecrets).map((s, idx) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            ref={idx === (activeTab === 'latest' ? latestSecrets : topSecrets).length - 1 ? lastSecretRef : null}
            className="flex items-center p-4 rounded-lg bg-[#181A20] shadow-md"
          >
            <img
              src={getAvatarUrl(s.author)}
              alt="avatar"
              className="w-8 h-8 rounded-full mr-3"
              loading="lazy"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">
                  {getAnonNick(s.author)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => likeSecret(s.id)}
                    className="p-2 rounded-full hover:bg-[#23243a] transition-colors"
                  >
                    ❤️ {s.likes}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => deleteSecret(s.id)}
                      className="p-2 rounded-full hover:bg-[#23243a] transition-colors"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              <p className="text-white text-base">{s.text}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>

    {/* Loading indicator */}
    {isFetchingNextPage && (
      <div className="w-full flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#21EF6E]"></div>
      </div>
    )}
  </div>
);
}