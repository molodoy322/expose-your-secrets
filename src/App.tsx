import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useEffect } from "react";
import { CONTRACT_ADDRESS, ABI, publicClient } from "./lib/contract";
import { encodeFunctionData } from "viem";
import HomeTab from "./HomeTab";
import ProfileTab from "./ProfileTab";
import GmTab from "./GmTab";
import BottomNav from "./BottomNav";

declare global { interface Window { ethereum?: any } }

const ADMIN_ADDRESS = "0xCaB3D1E0ECca7259aA47EaC724a482b80291BbD4"; // Вписуй свою адресу з мітамаска


const cardStyle = {
  background: "linear-gradient(140deg, #23243a 70%, #1a1b22 100%)",
  borderRadius: 18,
  border: "1.8px solid",
  borderImage: "linear-gradient(90deg, #21EF6E 0%, #FF2D55 100%) 1",
  boxShadow: "0 0 18px 1px #21ef6e22",
  padding: 22,
  marginBottom: 22,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

// --- LocalStorage ключ (унікальний для юзера) ---
function getProfileKey(address?: string) {
  return address ? `profile_last_seen_${address.toLowerCase()}` : "profile_last_seen";
}
function saveProfileState(address: string | undefined, arr: any[]) {
  if (!address) return;
  const my = arr.filter(s => s.author?.toLowerCase() === address.toLowerCase())
    .map(s => ({ id: s.id, likes: Number(s.likes) }));
  localStorage.setItem(getProfileKey(address), JSON.stringify(my));
}
function loadProfileState(address: string | undefined): {id: number, likes: number}[] {
  if (!address) return [];
  try {
    const raw = localStorage.getItem(getProfileKey(address));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

// --- Base Mainnet ChainId ---
const BASE_CHAIN_ID = 8453;

function RequireBaseNetwork({ children }: { children: React.ReactNode }) {
  const [isBase, setIsBase] = useState(true);

  useEffect(() => {
    async function checkNetwork() {
      if (window.ethereum && window.ethereum.request) {
        const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
        setIsBase(parseInt(chainIdHex, 16) === BASE_CHAIN_ID);
        window.ethereum.on("chainChanged", (chainId: string) => {
          setIsBase(parseInt(chainId, 16) === BASE_CHAIN_ID);
        });
      } else {
        setIsBase(false);
      }
    }
    checkNetwork();
  }, []);

  async function switchToBase() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + BASE_CHAIN_ID.toString(16) }],
      });
    } catch (e) {
      alert("Please switch network to Base in your wallet.");
    }
  }

  if (!isBase) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 90 }}>
        <h2 style={{ color: "#FF2D55" }}>Wrong Network!</h2>
        <p>Please switch to <b>Base</b> network in your wallet to use the app.</p>
        <button
          style={{
            marginTop: 18, fontSize: 19, borderRadius: 12, padding: "12px 30px",
            background: "#21EF6E", color: "#23243a", border: "none", fontWeight: 800, cursor: "pointer",
          }}
          onClick={switchToBase}
        >
          Switch to Base
        </button>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  const [fetchLoading, setFetchLoading] = useState(true);
  const { address, isConnected } = useAccount();
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [secret, setSecret] = useState("");
  const [secrets, setSecrets] = useState<any[]>([]);
  const [prevSecrets, setPrevSecrets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [activeTab, setActiveTab] = useState<"home" | "profile" | "gm">("home");
  const [hasNewProfile, setHasNewProfile] = useState(false);

  // --- Власні секрети юзера (НЕвидалені) ---
  const mySecrets = address
    ? secrets.filter(
        s => s.author?.toLowerCase() === address.toLowerCase() && !s.deleted
      )
    : [];

  // --- Видимі секрети (для головної сторінки) ---
  const visibleSecrets = secrets.filter(s => !s.deleted);

  // --- Fetch secrets & badge logic ---
async function fetchSecrets() {

  try {
    const count = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "getSecretsCount",
    });
    let arr = [];
    for (let i = 0; i < Number(count); i++) {
      const data: any = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "getSecret",
        args: [i],
      });
      arr.push({
        id: i,
        text: data[0],
        likes: data[1],
        author: data[2],
        timestamp: data[3],
        deleted: data[4], // ДОДАЄМО
      });
    }
    
    setPrevSecrets(secrets);
    setSecrets(arr.reverse());
    setFetchLoading(false); // <-- тільки цей!

    if (address) {
      const myNew = arr.filter(s => s.author?.toLowerCase() === address.toLowerCase())
        .map(s => ({ id: s.id, likes: Number(s.likes) }));
      const myPrev = loadProfileState(address);

      const hasUpdate = myNew.some(
        s => {
          const prev = myPrev.find(p => p.id === s.id);
          return !prev || prev.likes !== s.likes;
        }
      ) || myNew.length !== myPrev.length;

      setHasNewProfile(hasUpdate);
    }
  } catch (e) {
    setFetchLoading(false); // <-- тільки цей!
    setInfo("Failed to load secrets");
  }
}


  useEffect(() => {
  if (!address) return;
  setFetchLoading(true);
  fetchSecrets().finally(() => setFetchLoading(false));
}, [address]);



  useEffect(() => {
    if (address && secrets.length > 0) {
      const lsKey = getProfileKey(address);
      const saved = localStorage.getItem(lsKey);
      if (!saved) {
        const my = secrets.filter(s => s.author?.toLowerCase() === address.toLowerCase())
          .map(s => ({ id: s.id, likes: Number(s.likes) }));
        localStorage.setItem(lsKey, JSON.stringify(my));
        setHasNewProfile(false);
      }
    }
  }, [address, secrets]);

  useEffect(() => {
    if (activeTab === "profile" && hasNewProfile) {
      saveProfileState(address, secrets);
      setHasNewProfile(false);
    }
  }, [activeTab, hasNewProfile, address, secrets]);

  function parseError(e: any): string {
    if (e?.code === 4001 || e?.message?.toLowerCase().includes("user rejected")) {
      return "You rejected the transaction.";
    }
    if (e?.message && (
      e.message.toLowerCase().includes("insufficient funds") ||
      e.message.toLowerCase().includes("not enough") ||
      e.message.toLowerCase().includes("balance")
    )) {
      return "Not enough balance to pay gas or fee!";
    }
    if (e?.message && (
      e.message.toLowerCase().includes("chain") ||
      e.message.toLowerCase().includes("wrong network") ||
      e.message.toLowerCase().includes("unsupported")
    )) {
      return "Wrong network! Please switch to the correct network.";
    }
    if (e?.message && (e.message.toLowerCase().includes("already liked") || e.message.toLowerCase().includes("like only once"))) {
      return "You have already liked this secret!";
    }
    return "Error! " + (e.message || "Unknown error.");
  }

  

  // --- Функція додавання секрету ---
  async function submitSecret() {
    if (!secret.trim()) return setInfo("Please enter your secret!");
    setLoading(true);
    try {
      const [from] = await window.ethereum.request({ method: "eth_requestAccounts" });
      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          // 0.0001 ETH у wei = 100000000000000
          value: "0x" + (100000000000000).toString(16),
          data: encodeFunctionData({
            abi: ABI,
            functionName: "addSecret",
            args: [secret],
          }),
        }],
      });
      setInfo("Your secret has been added!");
      setSecret("");
      fetchSecrets();
    } catch (e: any) {
      setInfo(parseError(e));
    }
    setLoading(false);
  }

  // --- Функція лайка ---
  async function likeSecret(id: number) {
    setLoading(true);
    try {
      const [from] = await window.ethereum.request({ method: "eth_requestAccounts" });
      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          // 0.00002 ETH у wei = 20000000000000
          value: "0x" + (20000000000000).toString(16),
          data: encodeFunctionData({
            abi: ABI,
            functionName: "likeSecret",
            args: [id],
          }),
        }],
      });
      setInfo("Liked!");
      fetchSecrets();
    } catch (e: any) {
      setInfo(parseError(e));
    }
    setLoading(false);
  }

  // --- Функція boostLikes ---
async function boostLikes(id: number) {
  setLoading(true);
  try {
    const [from] = await window.ethereum.request({ method: "eth_requestAccounts" });
    await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{
        from,
        to: CONTRACT_ADDRESS,
        // Тут вартость суперлайку, можна змінити
        value: "0x" + (2000000000000000).toString(16),
        data: encodeFunctionData({
          abi: ABI,
          functionName: "boostLikes",
          args: [id],
        }),
      }],
    });
    setInfo("Super Like sent!");
    fetchSecrets();
  } catch (e: any) {
    setInfo(parseError(e));
  }
  setLoading(false);
}

async function deleteSecret(id: number) {
  setLoading(true);
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
    setInfo("Secret deleted!");
    fetchSecrets();
  } catch (e: any) {
    setInfo(parseError(e));
  }
  setLoading(false);
}


  const homeTabProps = {
    address,
    isConnected,
    connect,
    connectors,
    disconnect,
    secret,
    setSecret,
    loading,
    boostLikes,
    info,
    isAdmin,        // ← ДОДАЙ
    deleteSecret,
    secrets: visibleSecrets, // ТІЛЬКИ НЕВИДАЛЕНІ!
    prevSecrets,
    submitSecret,
    likeSecret,
    cardStyle,
    fetchSecrets, // ← ДОДАЙ ЦЕЙ ПРОП
  };

  const profileTabProps = {
    address,
    mySecrets,
    cardStyle,
    fetchSecrets,
  };

  return (
  <RequireBaseNetwork>
    {fetchLoading ? (           // ← Тут лише fetchLoading, не loading!
      <div style={{
        padding: 30,
        textAlign: "center",
        minHeight: "100vh",
        background: "linear-gradient(120deg, #181A20 0%, #23243a 100%)",
        color: "#21EF6E",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        fontWeight: 700
      }}>
        <span style={{ fontSize: 60, marginBottom: 24 }}>🌀</span>
        Loading secrets...
      </div>
    ) : (
      <div style={{
        padding: 30,
        textAlign: "center",
        minHeight: "100vh",
        background: "linear-gradient(120deg, #181A20 0%, #23243a 100%)",
        color: "#fff",
        paddingBottom: 90
      }}>
        <h1 style={{
          fontSize: "2.7rem",
          marginBottom: 16,
          background: "linear-gradient(90deg, #21EF6E, #FF2D55)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 800,
          letterSpacing: "1.3px"
        }}>
          🔥 Expose Your Secrets 🔥
        </h1>

        {activeTab === "home" && <HomeTab {...homeTabProps} />}
        {activeTab === "profile" && <ProfileTab {...profileTabProps} />}
        {activeTab === "gm" && <GmTab secrets={secrets} />}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasNewProfile={hasNewProfile}
        />
      </div>
    )}
  </RequireBaseNetwork>
);

}


