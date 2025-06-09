import React from 'react';
import { motion } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export default function HelpTab() {
  const faqItems: FAQItem[] = [
    {
      question: "What is $SECRET token?",
      answer: "$SECRET is our community token that will be distributed to active users of Expose Your Secrets. Earn $SECRET by posting secrets, giving likes, maintaining streaks, and completing achievements. The more active you are, the more $SECRET you'll earn! Stay tuned for our upcoming token launch and airdrop events."
    },
    {
      question: "How does the app work?",
      answer: "Expose Your Secrets is a platform for anonymous secret sharing. You can post your secrets, receive likes, and earn NFTs for achievements."
    },
    {
      question: "How much does it cost to post a secret?",
      answer: "Posting a secret costs 0.00001 ETH. This helps prevent spam and supports the platform's operation."
    },
    {
      question: "How do likes work?",
      answer: "A regular like costs 0.00002 ETH. You can like any secret except your own. There's also a Super Like for 0.002 ETH that adds 100 likes at once."
    },
    {
      question: "What are achievements?",
      answer: "Achievements are a reward system for platform activity. You can earn NFTs for the number of likes, posts, popularity, and daily check-ins."
    },
    {
      question: "What is GM Zone?",
      answer: "GM Zone allows you to make daily check-ins in Base network and maintain your streak. You get special achievements for this."
    },
    {
      question: "How can I delete my secret?",
      answer: "You can delete any of your secrets in your profile. After deletion, the secret will be hidden but will remain in the blockchain history."
    }
  ];

  const features: FeatureItem[] = [
    {
      icon: "🤫",
      title: "Anonymous Sharing",
      description: "Share your secrets without revealing your identity"
    },
    {
      icon: "❤️",
      title: "Like System",
      description: "Support others with likes and super likes"
    },
    {
      icon: "🏆",
      title: "Achievements",
      description: "Earn unique NFTs for your activity"
    },
    {
      icon: "🤝",
      title: "GM Zone",
      description: "Daily check-ins across multiple networks"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
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
      <div style={{
        fontSize: 36, fontWeight: 900, color: "#FFD600", marginBottom: 8,
        letterSpacing: 1.1, textShadow: "0 0 14px #FFD60055"
      }}>
        ❓ Help Center
      </div>
      <div style={{
        fontSize: 21, fontWeight: 700, color: "#fff",
        marginBottom: 13, textShadow: "0 0 8px #21EF6E"
      }}>
        Everything you need to know about Expose Your Secrets
      </div>

      {/* Features Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 20,
        marginTop: 30,
        marginBottom: 40
      }}>
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            style={{
              background: "rgba(34,36,58,0.66)",
              borderRadius: 16,
              padding: 20,
              textAlign: "center",
              border: "1px solid #21EF6E33",
              cursor: "pointer"
            }}
          >
            <div style={{
              fontSize: 32,
              marginBottom: 12
            }}>
              {feature.icon}
            </div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#21EF6E",
              marginBottom: 8
            }}>
              {feature.title}
            </h3>
            <p style={{
              fontSize: 14,
              color: "#aaa",
              lineHeight: 1.5
            }}>
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div style={{
        fontSize: 24,
        fontWeight: 800,
        color: "#FFD600",
        marginTop: 40,
        marginBottom: 20,
        textShadow: "0 0 8px #FFD60055"
      }}>
        Frequently Asked Questions
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        marginTop: 20
      }}>
        {faqItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01 }}
            style={{
              background: "rgba(34,36,58,0.66)",
              borderRadius: 16,
              padding: 20,
              textAlign: "left",
              border: "1px solid #21EF6E33"
            }}
          >
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#21EF6E",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <span style={{ fontSize: 20 }}>💡</span>
              {item.question}
            </h3>
            <p style={{
              fontSize: 16,
              color: "#aaa",
              lineHeight: 1.5,
              marginLeft: 30
            }}>
              {item.answer}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Quick Tips */}
      <div style={{
        marginTop: 40,
        padding: 20,
        background: "rgba(34,36,58,0.66)",
        borderRadius: 16,
        border: "1px solid #FFD60033"
      }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#FFD600",
          marginBottom: 12
        }}>
          Quick Tips
        </h3>
        <ul style={{
          listStyle: "none",
          padding: 0,
          textAlign: "left",
          color: "#aaa"
        }}>
          <li style={{ marginBottom: 8 }}>• Connect your wallet to start sharing secrets</li>
          <li style={{ marginBottom: 8 }}>• Use Super Likes to boost popular secrets</li>
          <li style={{ marginBottom: 8 }}>• Check GM Zone daily to maintain your streak</li>
          <li>• Complete achievements to earn unique NFTs</li>
        </ul>
      </div>
    </motion.div>
  );
}