import React from 'react';

function TabButton({ icon, text, active, onClick, badge }: { icon: string, text: string, active: boolean, onClick: () => void, badge?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`nav-button ${active ? 'active' : ''}`}
      style={{
        position: 'relative',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 'var(--spacing-xs)',
      }}
    >
      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      <span>{text}</span>
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--primary-color)',
          }}
        />
      )}
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
    <nav className="bottom-nav">
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
        icon="👋"
        text="GM"
        active={activeTab === "gm"}
        onClick={() => setActiveTab("gm")}
      />
      <TabButton
        icon="🏆"
        text="Achievements"
        active={activeTab === "achievements"}
        onClick={() => setActiveTab("achievements")}
      />
      <TabButton
        icon="❓"
        text="Help"
        active={activeTab === "help"}
        onClick={() => setActiveTab("help")}
      />
    </nav>
  );
}
