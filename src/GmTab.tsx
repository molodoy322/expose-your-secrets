import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---- Стилі для glow і кнопок ----
const chainColors = {
  BASE: "#21EF6E",
  MONAD: "#FFD600",
  SOLANA: "#9056FF",
};

const btnBaseStyle: React.CSSProperties = {
  padding: "11px 26px",
  fontSize: 17,
  fontWeight: 800,
  borderRadius: 15,
  border: "none",
  letterSpacing: 0.7,
  boxShadow: "0 0 18px 4px #21ef6e33",
  margin: "0 9px",
  transition: "all 0.19s",
  minWidth: 120,
  cursor: "pointer",
  outline: "none"
};

// --- Моки: replace after contract integration ---
const getMockStats = (chain: string) => ({
  streak: chain === "BASE" ? 5 : chain === "MONAD" ? 2 : 1,   // example: current streak
  total: chain === "BASE" ? 23 : chain === "MONAD" ? 6 : 8,   // example: total check-ins
  lastDate: chain === "BASE" ? "2025-06-07" : chain === "MONAD" ? "2025-06-06" : "2025-06-06"
});

interface GmTabProps {
  secrets: any[];
}

export default function GmTab({ secrets }: GmTabProps) {
  // Загальна кількість секретів
  const totalSecrets = secrets.length;
  // Загальна кількість лайків
  const totalLikes = secrets.reduce((sum, s) => sum + Number(s.likes), 0);

  // ---- State для Daily Check-in ----
  const [selectedChain, setSelectedChain] = useState<"BASE" | "MONAD" | "SOLANA">("BASE");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState<null | "success" | "fail">(null);

  // --- Моки статистики ---
  const userStats = getMockStats(selectedChain);

  // --- Handlers ---
  async function handleCheckIn() {
    setIsCheckingIn(true);
    setCheckinStatus(null);

    // --- Сюди заміниш на твій контракт ---
    setTimeout(() => {
      const success = Math.random() > 0.12; // мок результату (88% успіху)
      setIsCheckingIn(false);
      setCheckinStatus(success ? "success" : "fail");
    }, 1800);
  }

  // ---- Дизайн ----
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
      <div style={{
        fontSize: 36, fontWeight: 900, color: "#FFD600", marginBottom: 8,
        letterSpacing: 1.1, textShadow: "0 0 14px #FFD60055"
      }}>
        🤝 GM Zone
      </div>
      <div style={{
        fontSize: 21, fontWeight: 700, color: "#fff",
        marginBottom: 13, textShadow: "0 0 8px #21EF6E"
      }}>
        Daily Check-In & Crypto GM Movement
      </div>
      <div style={{
        margin: "0 0 20px 0", fontWeight: 700, color: "#21EF6E",
        fontSize: 17, letterSpacing: 0.3
      }}>
        Claim your streak in <span style={{ color: "#FFD600" }}>Base</span>, <span style={{ color: "#FFD600" }}>Monad</span>, <span style={{ color: "#9056FF" }}>Solana</span>
      </div>

      {/* --- Селектор мережі --- */}
      <div style={{ marginBottom: 18, display: "flex", justifyContent: "center", gap: 12 }}>
        {(["BASE", "MONAD", "SOLANA"] as const).map(chain => (
          <button
            key={chain}
            onClick={() => setSelectedChain(chain)}
            style={{
              ...btnBaseStyle,
              background: selectedChain === chain
                ? `linear-gradient(92deg, ${chainColors[chain]} 0%, #111 90%)`
                : "#181A20",
              color: selectedChain === chain ? "#23243a" : "#FFD600",
              border: selectedChain === chain
                ? `2.5px solid ${chainColors[chain]}`
                : "2px solid #333",
              boxShadow: selectedChain === chain
                ? `0 0 20px 2px ${chainColors[chain]}44`
                : "0 0 6px 2px #FFD60018",
              fontWeight: selectedChain === chain ? 900 : 800,
              opacity: selectedChain === chain ? 1 : 0.77,
              letterSpacing: 0.8,
              outline: "none"
            }}
          >
            {chain === "BASE" && <>🟢 BASE</>}
            {chain === "MONAD" && <>🟡 MONAD</>}
            {chain === "SOLANA" && <>🟣 SOLANA</>}
          </button>
        ))}
      </div>

      {/* --- Daily Check-In Box --- */}
      <div style={{
        margin: "0 auto 0 auto",
        maxWidth: 350,
        background: "rgba(28,32,42,0.85)",
        borderRadius: 22,
        border: `2px solid ${chainColors[selectedChain]}`,
        boxShadow: `0 0 14px 3px ${chainColors[selectedChain]}22`,
        padding: "22px 18px 21px 18px",
        marginBottom: 24,
        position: "relative"
      }}>
        {/* Стreak і Total */}
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <div>
            <div style={{
              fontSize: 16, color: "#FFD600", fontWeight: 700, letterSpacing: 0.5
            }}>🔥 Streak</div>
            <div style={{
              fontSize: 31, fontWeight: 900, color: chainColors[selectedChain], textShadow: `0 0 12px ${chainColors[selectedChain]}77`
            }}>{userStats.streak} <span style={{ fontSize: 17, color: "#FFD600" }}>days</span></div>
          </div>
          <div>
            <div style={{
              fontSize: 16, color: "#21EF6E", fontWeight: 700, letterSpacing: 0.5
            }}>🗓️ Total Check-Ins</div>
            <div style={{
              fontSize: 29, fontWeight: 900, color: "#FFD600", textShadow: "0 0 10px #FFD60077"
            }}>{userStats.total}</div>
          </div>
        </div>
        <div style={{
          fontSize: 15, color: "#999", marginBottom: 13
        }}>
          Last check-in: <span style={{ color: "#fff" }}>{userStats.lastDate}</span>
        </div>

        {/* --- Daily Check-In Button --- */}
        <button
          onClick={handleCheckIn}
          disabled={isCheckingIn}
          style={{
            ...btnBaseStyle,
            width: "100%",
            margin: 0,
            background: `linear-gradient(94deg, ${chainColors[selectedChain]} 0%, #23243a 110%)`,
            color: "#23243a",
            border: `2.3px solid ${chainColors[selectedChain]}`,
            fontWeight: 900,
            fontSize: 18,
            boxShadow: `0 0 19px 4px ${chainColors[selectedChain]}33, 0 1px 9px #FFD60033`,
            cursor: isCheckingIn ? "wait" : "pointer",
            opacity: isCheckingIn ? 0.72 : 1,
            marginBottom: 0,
            marginTop: 5,
            position: "relative"
          }}
        >
          <span style={{
            display: "inline-block",
            marginRight: 8,
            animation: isCheckingIn ? "spin360 1s linear infinite" : "none"
          }}>🌞</span>
          {isCheckingIn ? "Processing..." : "DAILY CHECK-IN"}
        </button>
        {/* --- Анімація статусу --- */}
        <AnimatePresence>
          {checkinStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.87, y: 9 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.75, y: 18 }}
              style={{
                color: "#21EF6E",
                fontWeight: 900,
                fontSize: 17,
                marginTop: 15,
                letterSpacing: 0.3,
                textShadow: "0 0 8px #21EF6E99"
              }}
            >✅ GM Check-In Success!</motion.div>
          )}
          {checkinStatus === "fail" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.87, y: 9 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.75, y: 18 }}
              style={{
                color: "#FF2D55",
                fontWeight: 900,
                fontSize: 17,
                marginTop: 15,
                letterSpacing: 0.3,
                textShadow: "0 0 8px #FF2D5599"
              }}
            >❌ Transaction failed. Try again.</motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---- Лічильники винесені ПІД ---- */}
<div style={{
  margin: "44px auto 0 auto",
  display: "flex",
  flexDirection: "row",
  gap: 34,
  justifyContent: "center",
  alignItems: "center",
  maxWidth: 700
}}>
  <div style={{
    background: "linear-gradient(100deg, #21EF6E33 60%, #FFD60033 100%)",
    padding: "17px 35px",
    borderRadius: 18,
    border: "1.6px solid #FFD600",
    boxShadow: "0 0 14px 2px #FFD60015",
    fontWeight: 900,
    fontSize: 22,
    color: "#FFD600",
    letterSpacing: 0.7,
    textShadow: "0 0 8px #FFD60077"
  }}>
    🚀 Secrets Dropped<br /><span style={{ color: "#fff", fontWeight: 900 }}>{totalSecrets}</span>
  </div>
  <div style={{
    background: "linear-gradient(100deg, #21EF6E33 60%, #FF2D5533 100%)",
    padding: "17px 35px",
    borderRadius: 18,
    border: "1.6px solid #FF2D55",
    boxShadow: "0 0 14px 2px #FF2D5515",
    fontWeight: 900,
    fontSize: 22,
    color: "#FF2D55",
    letterSpacing: 0.7,
    textShadow: "0 0 8px #FF2D5599"
  }}>
    ❤️ Likes Minted<br /><span style={{ color: "#fff", fontWeight: 900 }}>{totalLikes}</span>
  </div>
</div>

      {/* --- Анімація для спінера --- */}
      <style>
        {`
          @keyframes spin360 {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
      </style>
    </motion.div>
  );
}
