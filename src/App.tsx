import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { CONTRACT_ADDRESS, ABI, publicClient } from "./lib/contract";
import { encodeFunctionData } from "viem";
import HomeTab from "./HomeTab";
import ProfileTab from "./ProfileTab";
import GmTab from "./GmTab";
import AchievementsTab from "./AchievementsTab";
import HelpTab from "./HelpTab";
import BottomNav from "./BottomNav";
import { useInfiniteQuery } from '@tanstack/react-query';
import { initializeFarcaster } from "./lib/farcaster";
import { base } from 'wagmi/chains';
import { useChainId, useSwitchChain } from 'wagmi';

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
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

  useEffect(() => {
    async function checkNetwork() {
      if (!window.ethereum) {
        setIsCorrectNetwork(false);
        return;
      }

      try {
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        setIsCorrectNetwork(chainId === BASE_CHAIN_ID);
      } catch (error) {
        console.error('Error checking network:', error);
        setIsCorrectNetwork(false);
      }
    }
    checkNetwork();
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (newChainIdHex: string) => {
        const newChainId = parseInt(newChainIdHex, 16);
        setIsCorrectNetwork(newChainId === BASE_CHAIN_ID);
      });
    }
  }, []);

  async function switchToBase() {
    if (!window.ethereum) return;
    
    try {
      await switchChain({ chainId: BASE_CHAIN_ID });
    } catch (error) {
      console.error('Error switching network:', error);
      alert("Please switch network to Base in your wallet.");
    }
  }

  if (!isCorrectNetwork) {
    return (
      <div className="network-warning">
        <h2>⚠️ Wrong Network</h2>
        <p>Please switch to <b>Base</b> network in your wallet to use the app.</p>
        <button onClick={switchToBase}>
          Switch to Base
        </button>
      </div>
    );
  }
  return <>{children}</>;
}

// Типы для секретов и кэша
interface Secret {
  id: number;
  text: string;
  likes: number;
  author: string;
  timestamp: number;
  deleted: boolean;
}

interface CacheData {
  data: Secret[];
  timestamp: number;
}

// Константы для кэширования
const CACHE_KEY = 'secrets_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут
const MIN_REFRESH_INTERVAL = 30 * 1000; // 30 секунд

// --- Константа для пагинации ---
const PAGE_SIZE = 5;

// Оптимизируем функцию кэширования
function setCachedSecrets(secrets: Secret[]): void {
  try {
    const cacheData = {
      data: secrets.slice(0, PAGE_SIZE),
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.error('Failed to cache secrets:', e);
  }
}

// Оптимизируем функцию получения кэша
function getCachedSecrets(): Secret[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp }: CacheData = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

// Оптимизируем функцию получения страницы из кэша
function getCachedSecretsPage(pageNum: number): Secret[] | null {
  try {
    const cached = localStorage.getItem(`secrets_page_${pageNum}`);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

// Оптимизируем функцию кэширования страницы
function setCachedSecretsPage(pageNum: number, secrets: Secret[]): void {
  try {
    const cacheData = {
      data: secrets,
      timestamp: Date.now()
    };
    localStorage.setItem(`secrets_page_${pageNum}`, JSON.stringify(cacheData));
  } catch (e) {
    console.error('Failed to cache secrets page:', e);
  }
}

// Оптимизируем функцию fetchSecretsPage
async function fetchSecretsPage({ pageParam = 1 }) {
  const cached = getCachedSecretsPage(pageParam);
  if (cached) return cached;

  try {
    const count = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "getSecretsCount",
    });

    const total = Number(count);
    const start = Math.max(0, total - pageParam * PAGE_SIZE);
    const end = total - (pageParam - 1) * PAGE_SIZE;

    // Оптимизируем запросы к контракту - уменьшаем размер батча
    const batchSize = 3; // Уменьшаем размер батча
    const secretsData = [];
    
    for (let i = start; i < end; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, end);
      const batchPromises = [];
      
      for (let j = i; j < batchEnd; j++) {
        batchPromises.push(
          publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: "getSecret",
            args: [j],
          })
        );
      }
      
      // Добавляем задержку между батчами
      if (i > start) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const batchResults = await Promise.all(batchPromises);
      secretsData.push(...batchResults);
    }

    let arr = secretsData.map((data: any, idx) => ({
      id: start + idx,
      text: data[0],
      likes: Number(data[1]),
      author: data[2],
      timestamp: Number(data[3]),
      deleted: data[4],
    }));

    arr = arr.reverse();
    setCachedSecretsPage(pageParam, arr);
    return arr;
  } catch (error) {
    console.error('Error fetching secrets:', error);
    // Возвращаем кэшированные данные в случае ошибки
    return getCachedSecretsPage(pageParam) || [];
  }
}

// Оптимизируем throttledFetchNextPage
let lastFetchTime = 0;
const THROTTLE_DELAY = 3000; // Увеличиваем задержку

function throttledFetchNextPage(fetchNextPage: () => void) {
  const now = Date.now();
  if (now - lastFetchTime > THROTTLE_DELAY) {
    lastFetchTime = now;
    fetchNextPage();
  }
}

// Функция для проверки необходимости обновления
function shouldRefreshCache(): boolean {
  const cached = getCachedSecrets();
  if (!cached) return true;
  
  const lastUpdate = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}').timestamp;
  return Date.now() - lastUpdate > MIN_REFRESH_INTERVAL;
}

// Функция дебаунсинга
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function App() {
  // Ініціалізуємо Farcaster SDK з невеликою затримкою, щоб дати додатку відрендеритися
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeFarcaster();
    }, 500); // 500ms затримка

    return () => clearTimeout(timer);
  }, []); // Запускаємо лише один раз після початкового рендеру

  const [fetchLoading, setFetchLoading] = useState(true);
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [activeTab, setActiveTab] = useState<"home" | "profile" | "gm" | "achievements" | "help">("home");
  const [secret, setSecret] = useState("");
  const [info, setInfo] = useState("");
  const [hasNewProfile, setHasNewProfile] = useState(false);
  const [page, setPage] = useState(1);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [mySecrets, setMySecrets] = useState<Secret[]>([]);
  const [totalLikesGiven, setTotalLikesGiven] = useState(0);
  const [totalLikesReceived, setTotalLikesReceived] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ["secrets"],
    queryFn: fetchSecretsPage,
    getNextPageParam: (lastPage: Secret[], allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Обновляем секреты при изменении данных
  useEffect(() => {
    if (data?.pages) {
      const allSecrets = data.pages.flat() as Secret[];
      setSecrets(allSecrets);
      if (address) {
        const myNewSecrets = allSecrets.filter(s => s.author?.toLowerCase() === address.toLowerCase() && !s.deleted);
        setMySecrets(myNewSecrets);
        setTotalLikesReceived(myNewSecrets.reduce((sum: number, s: Secret) => sum + Number(s.likes), 0));
      }
    }
  }, [data, address]);

  const visibleSecrets = secrets.filter(s => !s.deleted);

  // Calculate total likes received for achievements
  const totalLikesReceivedForAchievements = mySecrets.reduce((sum, s) => sum + Number(s.likes), 0);

  // Функция обновления статистики
  const updateStats = useCallback(() => {
    if (!address) return;
    
    // Подсчитываем лайки
    const likesGiven = secrets.reduce((acc, s) => {
      return acc + (s.author?.toLowerCase() === address.toLowerCase() ? 0 : 1);
    }, 0);
    
    const likesReceived = secrets.reduce((acc, s) => {
      return acc + (s.author?.toLowerCase() === address.toLowerCase() ? s.likes : 0);
    }, 0);
    
    const posts = secrets.filter(s => s.author?.toLowerCase() === address.toLowerCase()).length;
    
    setTotalLikesGiven(likesGiven);
    setTotalLikesReceived(likesReceived);
    setTotalPosts(posts);
    
    // Обновляем стрик через GmTab
    if (activeTab === "gm") {
      const gmTab = document.querySelector('[data-tab="gm"]');
      if (gmTab) {
        const event = new CustomEvent('updateStreak', { detail: { address } });
        gmTab.dispatchEvent(event);
      }
    }
  }, [address, secrets, activeTab]);

  // Обновляем статистику при изменении данных
  useEffect(() => {
    updateStats();
  }, [updateStats]);

  // Обработчик обновления стрика
  const handleStreakUpdate = (streak: number) => {
    setCurrentStreak(streak);
    updateStats();
  };

  // --- Fetch secrets & badge logic ---
  async function fetchSecrets(newPage = 1, append = false) {
    if (!shouldRefreshCache() && newPage === 1) {
      return;
    }
    setFetchLoading(true);
    try {
      const count = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "getSecretsCount",
      });
      const total = Number(count);
      const start = Math.max(0, total - newPage * PAGE_SIZE);
      const end = total - (newPage - 1) * PAGE_SIZE;
      const promises = [];
      for (let i = start; i < end; i++) {
        promises.push(
          publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: "getSecret",
            args: [BigInt(i)],
          })
        );
      }
      const secretsData = await Promise.all(promises);
      let arr: Secret[] = secretsData.map((data: any, idx) => ({
        id: start + idx,
        text: data[0],
        likes: Number(data[1]),
        author: data[2],
        timestamp: Number(data[3]),
        deleted: data[4],
      }));
      arr = arr.reverse();
      let newSecrets: Secret[];
      if (append) {
        newSecrets = [...secrets, ...arr];
      } else {
        newSecrets = arr;
      }
      setSecrets(newSecrets);
      if (newPage === 1 && JSON.stringify(newSecrets.slice(0, PAGE_SIZE)) !== JSON.stringify(getCachedSecrets())) {
        setCachedSecrets(newSecrets);
      }
      setFetchLoading(false);
      setPage(newPage);
      if (address) {
        const myNew = newSecrets.filter(s => s.author?.toLowerCase() === address.toLowerCase())
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
      setFetchLoading(false);
      setInfo("Failed to load secrets");
    }
  }

  // Дебаунсированная версия fetchSecrets
  const debouncedFetchSecrets = useCallback(
    debounce(fetchSecrets, 1000),
    []
  );

  // Интервал обновления
  useEffect(() => {
    if (!address) return;
    // Первоначальная загрузка
    fetchSecrets();
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
    setFetchLoading(true);
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
      setInfo("Your secret has been added!");
      setSecret("");
      await fetchSecrets();
      updateStats();
    } catch (e: any) {
      setInfo(parseError(e));
    }
    setFetchLoading(false);
  }

  // --- Функція лайка ---
  const [loading, setLoading] = useState(false);
  async function likeSecret(id: number) {
    setLoading(true);
    try {
      const [from] = await window.ethereum.request({ method: "eth_requestAccounts" });
      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          value: "0x" + (20000000000000).toString(16),
          data: encodeFunctionData({
            abi: ABI,
            functionName: "likeSecret",
            args: [BigInt(id)],
          }),
        }],
      });
      setInfo("Liked!");
      await fetchSecrets();
      updateStats();
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
            args: [BigInt(id)],
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
            args: [BigInt(id)],
          }),
        }],
      });
      setInfo("Secret deleted!");
      await fetchSecrets();
      updateStats();
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
    loading: fetchLoading,
    boostLikes,
    info,
    isAdmin: address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase(),
    deleteSecret,
    secrets: visibleSecrets,
    prevSecrets: secrets,
    submitSecret,
    likeSecret,
    cardStyle,
    fetchNextPage: () => throttledFetchNextPage(fetchNextPage),
    hasNextPage,
    isFetchingNextPage,
    refetchSecrets: refetch,
  };

  const profileTabProps = {
    address,
    mySecrets,
    cardStyle,
    fetchSecrets,
  };

  return (
    <div className="app-container">
      <div className="flex-col" style={{
        flex: 1,
        paddingTop: "var(--spacing-md)",
        paddingBottom: "calc(var(--button-height) + var(--spacing-xl))",
        textAlign: "center",
      }}>
        <div className="flex-col" style={{
          maxWidth: "var(--container-width)",
          margin: "0 auto",
          padding: "0 var(--spacing-md)",
        }}>
          {activeTab === "home" && <HomeTab {...homeTabProps} />}
          {activeTab === "profile" && <ProfileTab {...profileTabProps} />}
          {activeTab === "gm" && <GmTab secrets={secrets} onStreakUpdate={handleStreakUpdate} />}
          {activeTab === "achievements" && (
            <AchievementsTab
              address={address}
              totalLikesGiven={totalLikesGiven}
              totalPosts={totalPosts}
              totalLikesReceived={totalLikesReceived}
              streak={currentStreak}
            />
          )}
          {activeTab === "help" && <HelpTab />}
        </div>
      </div>
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasNewProfile={hasNewProfile}
      />
      <div className="flex flex-col items-center w-full max-w-[420px] mx-auto px-4">
        {!isConnected && (
          <button
            onClick={() => connect({ connector: connectors[0] })}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-[#21EF6E] to-[#FF2D55] text-white font-bold shadow-lg hover:opacity-90 transition-all duration-200"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}


