import React from 'react';

function TabButton({ icon, text, active, onClick, badge }: { icon: string, text: string, active: boolean, onClick: () => void, badge?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="button"
      style={{
        background: active ? "rgba(33,239,110,0.13)" : "rgba(34,36,58,0.66)",
        color: active ? "var(--primary-color)" : "var(--text-color)",
        fontWeight: active ? 700 : 500,
        position: "relative",
        minWidth: "auto",
        width: "100%",
        maxWidth: "80px"
      }}
    >
      <span style={{
        fontSize: "1.5rem",
        marginBottom: "2px",
        filter: active ? "drop-shadow(0 0 5px var(--primary-color))" : "none"
      }}>
        {icon}
        {badge && (
          <span style={{
            position: "absolute",
            right: "8px",
            top: "2px",
            width: "8px",
            height: "8px",
            background: "var(--secondary-color)",
            borderRadius: "50%",
            border: "2px solid var(--background-dark)",
            display: "inline-block",
            zIndex: 20,
            boxShadow: "0 0 4px var(--secondary-color)"
          }} />
        )}
      </span>
      <span style={{
        fontSize: "0.75rem",
        letterSpacing: "0.2px",
        textShadow: active ? "0 0 5px var(--primary-color)" : "none"
      }}>
        {text}
      </span>
    </button>
  );
}

interface BottomNavProps {
  activeTab: "home" | "profile" | "gm" | "achievements" | "help";
  setActiveTab: (tab: "home" | "profile" | "gm" | "achievements" | "help") => void;
  hasNewProfile: boolean;
}

export default function BottomNav({ activeTab, setActiveTab, hasNewProfile }: BottomNavProps) {
  return (
    <nav className="bottom-nav" style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "rgba(34,36,58,0.95)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      borderTop: "1px solid var(--primary-color)",
      zIndex: 1000,
      padding: "0.5rem 0",
      boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "0.5rem",
        maxWidth: "100%",
        margin: "0 auto",
        gap: "0.5rem",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <TabButton
          icon="🏆"
          text="Achievements"
          active={activeTab === "achievements"}
          onClick={() => setActiveTab("achievements")}
        />
        <TabButton
          icon="🤝"
          text="GM"
          active={activeTab === "gm"}
          onClick={() => setActiveTab("gm")}
        />
        <TabButton
          icon="🏠"
          text="Home"
          active={activeTab === "home"}
          onClick={() => setActiveTab("home")}
        />
        <TabButton
          icon="👤"
          text="Profile"
          active={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
          badge={hasNewProfile}
        />
        <TabButton
          icon="❓"
          text="Help"
          active={activeTab === "help"}
          onClick={() => setActiveTab("help")}
        />
      </div>
    </nav>
  );
}
