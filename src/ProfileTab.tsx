import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CONTRACT_ADDRESS, ABI } from "./lib/contract";
import { encodeFunctionData } from "viem";

interface ProfileTabProps {
  address: string | undefined;
  mySecrets: any[];
  cardStyle: any;
  fetchSecrets?: () => void;
}

export default function ProfileTab({ address, mySecrets, cardStyle, fetchSecrets }: ProfileTabProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Подсчет статистики
  const totalLikes = mySecrets.reduce((sum, s) => sum + Number(s.likes), 0);

  // Форматирование даты
  function formatDate(timestamp: number) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Функция для шеринга в Farcaster
  async function shareToFarcaster(secret: any) {
    try {
      await window.frame.sdk.actions.post({
        title: "Expose Your Secrets",
        image: "https://placehold.co/900x600.png?text=Secret+Shared",
        buttons: [
          {
            label: "View Secret",
            action: "post_redirect",
            target: window.location.origin
          }
        ],
        postUrl: window.location.origin,
        input: {
          text: secret.text
        }
      });
    } catch (error) {
      console.error("Error sharing to Farcaster:", error);
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        alert("Шеринг в Farcaster работает только на публичном домене. При разработке на localhost эта функция недоступна.");
      } else {
        alert("Не удалось поделиться в Farcaster. Пожалуйста, попробуйте снова.");
      }
    }
  }

  async function handleDeleteSecret(id: number) {
    if (!window.ethereum) return alert("No wallet found!");
    try {
      const [from] = await window.ethereum.request({ method: "eth_requestAccounts" });
      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: ABI,
            functionName: "deleteSecret",
            args: [id],
          }),
        }],
      });
      setShowDeleteConfirm(null);
      fetchSecrets && fetchSecrets();
    } catch (e: any) {
      alert("Error deleting secret! " + (e?.message || ""));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8,
        ease: [0.34, 1.56, 0.64, 1],
        staggerChildren: 0.1
      }}
      style={{
        maxWidth: 720,
        margin: "0px auto 0 auto",
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
      {/* Заголовок */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          fontSize: 36,
          fontWeight: 900,
          background: "linear-gradient(90deg, #21EF6E, #FFD600)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 8,
          letterSpacing: 1.1,
          textShadow: "0 0 14px #21EF6E55"
        }}
      >
        👤 Your Profile
      </motion.div>

      {/* Адрес кошелька */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          fontSize: 17,
          color: "#FF2D55",
          fontWeight: 600,
          marginBottom: 24,
          padding: "8px 16px",
          background: "rgba(255,45,85,0.1)",
          borderRadius: 12,
          display: "inline-block"
        }}
      >
        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
      </motion.div>

      {/* Статистика */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 20,
          marginBottom: 32
        }}
      >
        <div style={{
          background: "linear-gradient(140deg, #23243a 70%, #1a1b22 100%)",
          borderRadius: 16,
          padding: "20px",
          border: "2px solid #21EF6E",
          boxShadow: "0 0 20px 2px #21ef6e33"
        }}>
          <div style={{ fontSize: 18, color: "#21EF6E", marginBottom: 8 }}>Total Posts</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>{mySecrets.length}</div>
        </div>
        <div style={{
          background: "linear-gradient(140deg, #23243a 70%, #1a1b22 100%)",
          borderRadius: 16,
          padding: "20px",
          border: "2px solid #FFD600",
          boxShadow: "0 0 20px 2px #ffd60033"
        }}>
          <div style={{ fontSize: 18, color: "#FFD600", marginBottom: 8 }}>Total Likes</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>{totalLikes}</div>
        </div>
      </motion.div>

      {/* Список секретов */}
      {mySecrets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{
            color: "#888",
            fontSize: 18,
            fontStyle: "italic",
            padding: "40px 0"
          }}
        >
          You haven't posted any secrets yet!
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20
          }}
        >
          <AnimatePresence>
            {mySecrets.map((s, index) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
                style={{
                  ...cardStyle,
                  position: "relative",
                  overflow: "hidden",
                  border: "2px solid #21EF6E",
                  boxShadow: "0 0 20px 2px #21ef6e33"
                }}
              >
                <div style={{
                  fontSize: 17,
                  color: "#fff",
                  fontStyle: "italic",
                  marginBottom: 12,
                  lineHeight: 1.5
                }}>
                  {s.text}
                </div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: "auto"
                }}>
                  <div style={{
                    fontSize: 14,
                    color: "#888",
                    fontStyle: "italic"
                  }}>
                    Posted: {formatDate(s.timestamp)}
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{
                      fontSize: 15,
                      color: "#FFD600",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}>
                      ❤️ {Number(s.likes)} likes
                    </div>
                    <div style={{
                      display: "flex",
                      gap: 8
                    }}>
                      <button
                        onClick={() => shareToFarcaster(s)}
                        style={{
                          padding: "6px 16px",
                          borderRadius: 9,
                          background: "#8A63D2",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 14,
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: "0 0 10px 2px #8a63d233"
                        }}
                      >
                        Share
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(s.id)}
                        style={{
                          padding: "6px 16px",
                          borderRadius: 9,
                          background: "#FF2D55",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 14,
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: "0 0 10px 2px #ff2d5533"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Диалог подтверждения удаления */}
      <AnimatePresence>
        {showDeleteConfirm !== null && (
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
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)"
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: "linear-gradient(140deg, #23243a 70%, #1a1b22 100%)",
                padding: "30px",
                borderRadius: 20,
                border: "2px solid #FF2D55",
                boxShadow: "0 0 30px 5px #ff2d5533",
                maxWidth: 400,
                width: "90%",
                textAlign: "center"
              }}
            >
              <div style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#FF2D55",
                marginBottom: 16
              }}>
                Delete Secret?
              </div>
              <div style={{
                fontSize: 16,
                color: "#aaa",
                marginBottom: 24
              }}>
                This action cannot be undone. Are you sure you want to delete this secret?
              </div>
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: 16
              }}>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 12,
                    background: "rgba(34,36,58,0.66)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 16,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSecret(showDeleteConfirm!)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 12,
                    background: "#FF2D55",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 16,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 0 15px 2px #ff2d5533"
                  }}
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
