import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserStats } from "./lib/contract";





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
   fetchSecrets: () => void;
  prevSecrets?: any[];
  loading: boolean;
  info: string;
  submitSecret: () => void;
  likeSecret: (id: number) => void;
  isAdmin: boolean;
deleteSecret: (id: number) => void;
  cardStyle: React.CSSProperties;
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
  fetchSecrets,
  loading,
  isAdmin,           // <-- додав!
  deleteSecret,      // <-- додав!
  submitSecret,
  likeSecret,
   boostLikes,
  cardStyle,
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

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {

    setIsRefreshing(true);
    await fetchSecrets();
    setTimeout(() => setIsRefreshing(false), 420); // коротка пауза для анімації
  };


React.useEffect(() => {
  async function fetchStats() {
    if (address) {
      try {
        const [secretsPosted, likesGiven] = await getUserStats(address) as [number, number];
        setUserStats({ secretsPosted: Number(secretsPosted), likesGiven: Number(likesGiven) });
      } catch (e) {
        setUserStats({ secretsPosted: 0, likesGiven: 0 });
      }
    } else {
      setUserStats({ secretsPosted: 0, likesGiven: 0 });
    }
  }
  fetchStats();
}, [address]);



  const latestSecrets = secrets.filter(s => !s.deleted).slice(0, 10);
const topSecrets = [...secrets].filter(s => !s.deleted).sort((a, b) => Number(b.likes) - Number(a.likes)).slice(0, 10);


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
  const CardWrap = isMotion ? motion.li : "li";
  return (
    <CardWrap
      key={s.id}
      initial={isMotion && s.id === newSecretId ? { opacity: 0, scale: 0.88, filter: "blur(6px)" } : undefined}
      animate={isMotion && s.id === newSecretId ? { opacity: 1, scale: 1, filter: "blur(0px)" } : undefined}
      transition={isMotion ? { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] } : undefined}
      exit={isMotion ? { opacity: 0, scale: 0.8, filter: "blur(6px)" } : undefined}
      style={{
        ...cardStyle,
        ...getMyStyle(isMine),
        position: "relative",
        zIndex: s.id === newSecretId ? 2 : 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 180, // щоб лайк і лічильник були внизу навіть при короткому тексті
      }}
    >
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
    </CardWrap>
  );
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

      <button
  onClick={handleRefresh}
  disabled={isRefreshing}
  style={{
    margin: "0 auto 0 auto",
    display: "block",
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
    transition: "box-shadow 0.19s, border 0.15s, color 0.17s, background 0.22s",
    filter: isRefreshing ? "brightness(0.92)" : "none",
    opacity: isRefreshing ? 0.7 : 1,
    minWidth: 175,
    position: "relative"
  }}
>
  <span
    style={{
      display: "inline-block",
      marginRight: 10,
      verticalAlign: "middle",
      animation: isRefreshing ? "spin360 0.7s linear infinite" : "none",
      color: isRefreshing ? "#9056FF" : "#21EF6E",
      fontSize: 22,
      transition: "color 0.16s"
    }}
  >🌀</span>
  <span style={{
    fontWeight: 800,
    letterSpacing: 0.5,
    color: isRefreshing ? "#9056FF" : "#21EF6E",
    textShadow: isRefreshing ? "0 0 6px #9056FF55" : "none",
    transition: "color 0.16s"
  }}>
    REFRESH SECRETS
  </span>
  <style>
    {`
      @keyframes spin360 {
        0% { transform: rotate(0deg);}
        100% {transform: rotate(360deg);}
      }
    `}
  </style>
</button>


      {/* --- Дві колонки + розділювач --- */}
      <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>
        {/* Latest */}
        <div style={{ flex: 1, minWidth: 340 }}>
          <h2 style={{
              marginTop: -55,
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
              {latestSecrets.map(s => {
                const isMine = s.author?.toLowerCase() === address?.toLowerCase();
                return SecretCard(s, isMine, true);
              })}
            </AnimatePresence>
          </ul>
        </div>

        {/* Divider */}
        <div style={{
          width: 4,
          minHeight: 420,
          background: "linear-gradient(180deg, #21EF6E 0%, #FF2D55 100%)",
          borderRadius: 12,
          margin: "0 20px",
          opacity: 0.93
        }} />

        {/* Top */}
        <div style={{ flex: 1, minWidth: 340 }}>
          <h2 style={{
                marginTop: -55,

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
              return SecretCard(s, isMine, false);
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
    </>
  );
}
