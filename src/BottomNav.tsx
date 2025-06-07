

function TabButton({ icon, text, active, onClick, badge }: { icon: string, text: string, active: boolean, onClick: () => void, badge?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "rgba(33,239,110,0.13)" : "rgba(34,36,58,0.66)",
        border: "none",
        outline: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: active ? "#21EF6E" : "#fff",
        fontWeight: active ? 700 : 500,
        fontSize: 15,
        cursor: "pointer",
        padding: "2px 10px 2px 10px",
        position: "relative",
        borderRadius: 16,
        minWidth: 58,
        transition: "background 0.17s"
      }}
    >
      <span style={{
        fontSize: 30,
        marginBottom: 1,
        filter: active ? "drop-shadow(0 0 5px #21ef6e)" : "none"
      }}>
        {icon}
        {badge && (
          <span style={{
            position: "absolute",
            right: 12,
            top: 3,
            width: 14,
            height: 14,
            background: "#FF2D55",
            borderRadius: "50%",
            border: "2.5px solid #181A20",
            display: "inline-block",
            zIndex: 20,
            boxShadow: "0 0 4px #FF2D55"
          }} />
        )}
      </span>
      <span style={{
        marginTop: 1,
        fontSize: 13,
        letterSpacing: 0.2,
        textShadow: active ? "0 0 5px #21ef6e44" : "none"
      }}>
        {text}
      </span>
    </button>
  );
}

interface BottomNavProps {
  activeTab: "home" | "profile" | "gm";
  setActiveTab: (tab: "home" | "profile" | "gm") => void;
  hasNewProfile: boolean;
}

export default function BottomNav({ activeTab, setActiveTab, hasNewProfile }: BottomNavProps) {
  return (
    <div style={{
      position: "fixed",
      left: 0,
      bottom: 0,
      width: "100%",
      background: "rgba(27,27,34,0.77)",
      borderTop: "2.2px solid #21EF6E",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      padding: "8px 0 4px 0",
      zIndex: 999,
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      boxShadow: "0 0 22px 0 #21ef6e44"
    }}>
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
    </div>
  );
}
