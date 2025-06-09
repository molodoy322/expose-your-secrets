import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserStats } from "./lib/contract";
import { shareToFarcaster } from './lib/farcaster';





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
  isAdmin,           // <-- додав!
  deleteSecret,      // <-- додав!
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
            style={{width:24,height:24,borderRadius:6,background:"#23243a",border:"2px solid #23243a"}}
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

  async function submitSecret() {
    if (!secret.trim()) return setInfo("Please enter your secret!");
    setIsSubmitting(true);
    try {
      const [from] = await window.ethereum.request({ method: "eth_requestAccounts" });
      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          value: "0x" + (100000000000000).toString(16),
          data: encodeFunctionData({
            abi: ABI,
            functionName: "addSecret",
            args: [secret],
          }),
        }],
      });
      
      // Добавляем кнопку шаринга после успешного постинга
      const shareButton = document.createElement('button');
      shareButton.textContent = '🤫 Share on Farcaster';
      shareButton.style.cssText = `
        background: linear-gradient(90deg, #21EF6E, #FF2D55);
        border: none;
        color: #23243a;
        padding: 10px 20px;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 10px;
        transition: transform 0.2s;
      `;
      shareButton.onclick = () => {
        shareToFarcaster(
          `🤫 I just shared a secret on Expose Your Secrets!\n\n${secret}\n\nShare your secrets too: https://expose-your-secrets.vercel.app`,
          'https://expose-your-secrets.vercel.app/og.png'
        );
      };
      
      const infoElement = document.querySelector('.info-message');
      if (infoElement) {
        infoElement.appendChild(shareButton);
      }
      
      setInfo("Your secret has been added!");
      setSecret("");
      await fetchSecrets();
      updateStats();
    } catch (e: any) {
      setInfo(parseError(e));
    }
    setIsSubmitting(false);
  }

  return (
    <>
      {/* Кнопка connect/disconnect */}
      {!isConnected ? (
        <button
          style={{
            ...btnStyle,
            background: "#161616",
            border: "2px solid #FF2D55",
            marginBottom: 24
          }}
          onClick={() => connect({ connector: connectors[0] })}
        >
          Connect Wallet
        </button>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, marginBottom: 6 }}>
            Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
          <button
            style={{
              ...btnStyle,
              padding: "7px 24px",
              border: "2px solid #FF2D55",
              marginTop: 6,
              background: "#161616",
              color: "#fff"
            }}
            onClick={() => disconnect()}
          >
            Disconnect
          </button>
        </div>
      )}

      <hr style={{
        margin: "30px 0",
        border: "none",
        height: 2,
        background: "linear-gradient(90deg, #21EF6E 0%, #FF2D55 100%)",
        borderRadius: 6
      }} />

      <h3 style={{ fontSize: "1.6rem", letterSpacing: "0.8px" }}>
        Share your secret anonymously (0.25 cents in ETH)
      </h3>
      <textarea
        value={secret}
        onChange={e => setSecret(e.target.value)}
        maxLength={450}
        rows={5}
        style={{
          width: "100%",
          maxWidth: 500,
          fontSize: 18,
          borderRadius: 13,
          marginTop: 12,
          padding: 14,
          background: "#23243a",
          color: "#fff",
          border: "2px solid #21EF6E",
          outline: "none",
        }}
        placeholder="Type your secret here..."
        disabled={!isConnected || loading}
      />
      <div style={{ textAlign: "right", marginRight: 8, color: secret.length > 440 ? "#FF2D55" : "#888", fontSize: 16 }}>
  {secret.length} / 450
</div>
      <br />

      {/* --- User stats widget --- */}
<div
  style={{
    background: "none",
    paddingTop: 2,
    paddingBottom: 2,
    marginTop: -42,     // трохи підняти ВГОРУ, якщо треба ще вище — зроби -60...
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 30,
  }}
>
  <div
    style={{
      background: "linear-gradient(90deg, #23243a 80%, #1a1b22 100%)",
      border: "2.2px solid #21EF6E",
      borderRadius: 14,
      padding: "18px 26px",
      minWidth: 130,
      textAlign: "center",
      fontWeight: 800,
      fontSize: 18,
      color: "#21EF6E",
      boxShadow: "0 0 12px 2px #21ef6e33",
      letterSpacing: "0.6px",
    }}
  >
    Posts Today<br />
    <span style={{ fontSize: 34, color: "#fff", fontWeight: 900 }}>{postsToday}</span>
    <span style={{ fontSize: 16, color: "#aaa", fontWeight: 700 }}> / 3</span>
  </div>
  <div
    style={{
      background: "linear-gradient(90deg, #23243a 80%, #1a1b22 100%)",
      border: "2.2px solid #FF2D55",
      borderRadius: 14,
      padding: "18px 26px",
      minWidth: 130,
      textAlign: "center",
      fontWeight: 800,
      fontSize: 18,
      color: "#FF2D55",
      boxShadow: "0 0 12px 2px #ff2d5533",
      letterSpacing: "0.6px",
    }}
  >
    Likes Today<br />
    <span style={{ fontSize: 34, color: "#fff", fontWeight: 900 }}>{likesToday}</span>
    <span style={{ fontSize: 16, color: "#aaa", fontWeight: 700 }}> / 15</span>
  </div>
</div>
  


      <button
        onClick={submitSecret}
        disabled={submitDisabled}
        style={{
          ...btnStyle,
          marginRight: 14,
          marginTop: 14,
          opacity: submitDisabled ? 0.55 : 1,
          background: submitDisabled ? "#22252a" : "#161616",
          color: submitDisabled ? "#aaa" : "#fff",
          border: submitDisabled ? "2px solid #343a40" : "2px solid #21EF6E",
          boxShadow: submitDisabled ? "none" : "0 0 10px #21ef6e55",
          cursor: submitDisabled ? "not-allowed" : "pointer"
        }}
      >
        Drop a Secret (0.00001 ETH)
        <span style={{ fontSize: 27, marginLeft: 7 }}>🤫💬</span>
      </button>

      <hr style={{
        margin: "30px 0",
        border: "none",
        height: 2,
        background: "linear-gradient(90deg, #21EF6E 0%, #FF2D55 100%)",
        borderRadius: 6
      }} />

      {/* --- Дві колонки + розділювач --- */}
      <div style={{ display: "flex", justifyContent: "center", gap: 120, alignItems: "flex-start", position: "relative" }}>
        {/* Latest */}
        <div style={{ flex: 1, minWidth: 340, marginRight: 40 }}>
          <h2 style={{
            marginTop: -10,
            fontSize: "2.1rem",
            marginBottom: 10,
            background: "linear-gradient(90deg, #21EF6E 0%, #FF2D55 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 800,
            letterSpacing: "0.8px"
          }}>Latest Secrets</h2>
          <ul style={{ listStyle: "none", padding: 0, maxWidth: 420, margin: "0 auto" }}>
            {latestSecrets.length === 0 && (
              <li style={{ color: "#888", fontStyle: "italic" }}>No secrets yet. Be the first!</li>
            )}
            <AnimatePresence>
              {latestSecrets.map((s, idx) => {
                const isMine = s.author?.toLowerCase() === address?.toLowerCase();
                const ref = idx === latestSecrets.length - 1 ? lastSecretRef : undefined;
                return (
                  <motion.li
                    ref={ref}
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      ...cardStyle,
                      ...getMyStyle(isMine),
                      position: "relative",
                      zIndex: 1,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 180,
                    }}
                  >
                    {SecretCardMemo(s, isMine, true)}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          {isFetchingNextPage && (
            <div style={{ 
              color: '#21EF6E', 
              margin: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <span style={{ animation: 'spin360 1s linear infinite' }}>🔄</span>
              Loading more secrets...
            </div>
          )}
        </div>

        {/* REFRESH BUTTON по центру над лінією */}
        <div style={{ position: "absolute", left: "50%", top: -20, transform: "translateX(-50%)", zIndex: 10 }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: "12px 32px",
              background: "#23243a",
              color: "#e4e6ef",
              border: isRefreshing ? "2px solid #9056FF" : "2px solid #21EF6E",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 18,
              boxShadow: isRefreshing ? "0 0 16px #9056FF33" : "0 2px 14px #21ef6e22",
              cursor: isRefreshing ? "wait" : "pointer",
              letterSpacing: 1.1,
              minWidth: 175,
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 10,
              filter: isRefreshing ? "brightness(0.92)" : "none",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                animation: isRefreshing ? "spin360 0.7s linear infinite" : "none",
                color: isRefreshing ? "#9056FF" : "#21EF6E",
                fontSize: 22,
                transition: "color 0.16s"
              }}
            >🔄</span>
            <span style={{
              fontWeight: 800,
              letterSpacing: 0.5,
              color: isRefreshing ? "#9056FF" : "#21EF6E",
              textShadow: isRefreshing ? "0 0 6px #9056FF55" : "none",
              transition: "color 0.16s"
            }}>
              {isRefreshing ? "Refreshing..." : "REFRESH SECRETS"}
            </span>
          </button>
          <style>
            {`
              @keyframes spin360 {
                0% { transform: rotate(0deg);}
                100% {transform: rotate(360deg);}
              }
            `}
          </style>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 7,
            height: '100%',
            minHeight: 420,
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: 'translateX(-50%)',
            borderRadius: 16,
            opacity: 0.9,
            zIndex: 2,
            background: 'linear-gradient(180deg, #21EF6E, #FFD600, #FF2D55, #9056FF, #21EF6E)',
            backgroundSize: '100% 400%',
            animation: 'rgb-divider-move 4s linear infinite',
            boxShadow: '0 0 18px 4px #21EF6E33, 0 0 18px 8px #FF2D5533',
          }}
        />
        <style>
          {`
            @keyframes rgb-divider-move {
              0% { background-position: 0% 0%; }
              100% { background-position: 0% 100%; }
            }
          `}
        </style>

        {/* Top */}
        <div style={{ flex: 1, minWidth: 340, marginLeft: 40 }}>
          <h2 style={{
                marginTop: -10,

            fontSize: "2.1rem",
            marginBottom: 10,
            background: "linear-gradient(90deg, #FF2D55 0%, #21EF6E 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 800,
            letterSpacing: "0.8px"
          }}>Top Secrets</h2>
          <ul style={{ listStyle: "none", padding: 0, maxWidth: 420, margin: "0 auto" }}>
            {topSecrets.length === 0 && (
              <li style={{ color: "#888", fontStyle: "italic" }}>No secrets yet. Be the first!</li>
            )}
            {topSecrets.map(s => {
              const isMine = s.author?.toLowerCase() === address?.toLowerCase();
              return (
                <li
                  key={s.id}
                  style={{
                    ...cardStyle,
                    ...getMyStyle(isMine),
                    position: "relative",
                    zIndex: 1,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 180,
                  }}
                >
                  {SecretCardMemo(s, isMine, false)}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {/* --- Додаємо keyframes для glow-ефекту прямо тут (або в index.css) --- */}
      <style>
        {`
          @keyframes unicorn-glow {
            0% { box-shadow: 0 0 18px 3px #ffd60099, 0 0 0px 0px #FFD600; }
            50% { box-shadow: 0 0 30px 9px #FFD600, 0 0 24px 6px #ffd600cc; }
            100% { box-shadow: 0 0 18px 3px #ffd60099, 0 0 0px 0px #FFD600; }
          }
        `}
      </style>

      {info && (
        <div className="info-message" style={{
          background: "rgba(33, 239, 110, 0.1)",
          border: "1px solid #21EF6E",
          borderRadius: 12,
          padding: "12px 20px",
          marginBottom: 20,
          color: "#21EF6E",
          fontSize: 14,
          fontWeight: 600
        }}>
          {info}
          {info === "Your secret has been added!" && (
            <button
              onClick={() => shareToFarcaster(
                `🤫 I just shared a secret on Expose Your Secrets!\n\n${secret}\n\nShare your secrets too: https://expose-your-secrets.vercel.app`,
                'https://expose-your-secrets.vercel.app/og.png'
              )}
              style={{
                background: "linear-gradient(90deg, #21EF6E, #FF2D55)",
                border: "none",
                color: "#23243a",
                padding: "10px 20px",
                borderRadius: 12,
                fontWeight: 700,
                cursor: "pointer",
                marginTop: 10,
                transition: "transform 0.2s",
                display: "block",
                width: "100%"
              }}
            >
              🤫 Share on Farcaster
            </button>
          )}
        </div>
      )}
    </>
  );
}
