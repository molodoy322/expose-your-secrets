import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { CONTRACT_ADDRESS, ABI, publicClient, withFailover } from "./lib/contract";
import { encodeFunctionData } from "viem";
import { debounce } from "lodash";
import { motion, AnimatePresence } from "framer-motion";
import { initializeFarcaster } from "./lib/farcaster";
import HomeTab from "./HomeTab";
import ProfileTab from "./ProfileTab";
import GmTab from "./GmTab";
import AchievementsTab from "./AchievementsTab";
import HelpTab from "./HelpTab";
import BottomNav from "./BottomNav";
import { getAvatarUrl } from "./lib/assets";

// Адрес админа
const ADMIN_ADDRESS = "0x1234567890123456789012345678901234567890";

// Стиль карточки
const cardStyle = {
  background: "linear-gradient(140deg, #23243a 70%, #1a1b22 100%)",
  borderRadius: 16,
  border: "2px solid #21EF6E",
  padding: 20,
  boxShadow: "0 0 20px 2px #21ef6e33",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  position: "relative" as const,
  overflow: "hidden",
  width: "100%",
  boxSizing: "border-box" as const,
};

// Интерфейс для секрета
interface Secret {
  id: number;
  text: string;
  likes: number;
  author: string;
  timestamp: number;
  deleted: boolean;
}

// Функции для работы с профилем
function getProfileKey(address: string): string {
  return `profile_${address.toLowerCase()}`;
}

function loadProfileState(address: string): { id: number; likes: number }[] {
  try {
    const saved = localStorage.getItem(getProfileKey(address));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveProfileState(address: string, secrets: Secret[]): void {
  try {
    const my = secrets.filter(s => s.author?.toLowerCase() === address.toLowerCase())
      .map(s => ({ id: s.id, likes: Number(s.likes) }));
    localStorage.setItem(getProfileKey(address), JSON.stringify(my));
  } catch (e) {
    console.error('Failed to save profile state:', e);
  }
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
            args: [BigInt(j)],
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

  // Убираем React Query и используем простую загрузку
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  // Обновляем секреты при изменении данных
  useEffect(() => {
    console.log('Secrets updated:', secrets.length, secrets);
    if (address && secrets.length > 0) {
      const myNewSecrets = secrets.filter(s => 
        s.author?.toLowerCase() === address.toLowerCase() && !s.deleted
      );
      setMySecrets(myNewSecrets);
      setTotalLikesReceived(myNewSecrets.reduce((sum: number, s: Secret) => sum + Number(s.likes), 0));
    }
  }, [secrets, address]);

  const visibleSecrets = secrets.filter(s => !s.deleted);

  // Calculate total likes received for achievements
  const totalLikesReceivedForAchievements = mySecrets.reduce((sum, s) => sum + Number(s.likes), 0);

  // Функция обновления статистики
  const updateStats = useCallback(() => {
    if (!address) return;
    
    // Подсчитываем посты пользователя (не удаленные)
    const userPosts = secrets.filter(s => 
      s.author?.toLowerCase() === address.toLowerCase() && !s.deleted
    );
    
    // Подсчитываем лайки, полученные пользователем
    const likesReceived = userPosts.reduce((acc, s) => acc + Number(s.likes), 0);
    
    // Подсчитываем общее количество постов пользователя
    const posts = userPosts.length;
    
    // Для лайков, данных пользователем, нужно использовать данные из контракта
    // Пока используем 0, так как эта информация не хранится в секретах
    const likesGiven = 0;
    
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
  };

  // --- Fetch secrets & badge logic ---
  async function fetchSecrets(newPage = 1, append = false) {
    console.log('Fetching secrets:', { newPage, append });
    setFetchLoading(true);
    setInfo(""); // Очищаем предыдущие сообщения об ошибках
    
    try {
      // Проверяем подключение к RPC
      console.log('Checking RPC connection...');
      let blockNumber;
      try {
        blockNumber = await withFailover(client => client.getBlockNumber());
        console.log('Current block number:', blockNumber);
      } catch (e) {
        console.error('Error in getBlockNumber:', e);
        setInfo("Ошибка при подключении к RPC: " + (e?.message || e));
        setFetchLoading(false);
        return;
      }
      
      console.log('Reading contract count...');
      let count;
      try {
        count = await withFailover(client => client.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: "getSecretsCount",
        }));
        console.log('getSecretsCount result:', count);
      } catch (e) {
        console.error('Error in getSecretsCount:', e);
        setInfo("Ошибка при получении количества секретов: " + (e?.message || e));
        setFetchLoading(false);
        return;
      }
      const total = Number(count);
      console.log('Total secrets count (fetchSecrets):', total);
      
      if (total === 0) {
        console.log('No secrets found');
        setSecrets([]);
        setFetchLoading(false);
        return;
      }
      
      // Загружаем все секреты через multicall
      console.log('Loading secrets from contract (multicall)...');
      const calls = [];
      for (let i = 0; i < total; i++) {
        calls.push({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: "getSecret",
          args: [BigInt(i)],
        });
      }
      // viem multicall возвращает { status, result } для каждого вызова
      // @ts-expect-error
      const multicallResult: any[] = await publicClient.multicall({ contracts: calls }) as any[];
      const secretsData = multicallResult.map((r, idx) => {
        if (r.status === 'success') {
          return r.result;
        } else {
          console.error(`Multicall error for secret #${idx}:`, r.error);
          return null;
        }
      });
      console.log('Fetched secrets data (multicall):', secretsData.length);
      console.log('Raw secrets data:', secretsData);
      
      let arr: Secret[] = secretsData.map((data: any, idx) => {
        if (!data) return null;
        return {
          id: idx,
          text: data[0],
          likes: Number(data[1]),
          author: data[2],
          timestamp: Number(data[3]),
          deleted: data[4],
        };
      }).filter(Boolean);
      
      // Переворачиваем массив, чтобы новые секреты были в начале
      arr = arr.reverse();
      console.log('Processed secrets (fetchSecrets):', arr.length);
      console.log('Final secrets array:', arr);
      
      if (append) {
        setSecrets(prevSecrets => {
          const newSecrets = [...prevSecrets, ...arr];
          return newSecrets;
        });
      } else {
        setSecrets(arr);
      }
      setPage(newPage);
      
      // Проверяем профиль пользователя
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
      console.error('Error fetching secrets (fetchSecrets):', e);
      setInfo("Failed to load secrets");
    } finally {
      setFetchLoading(false);
    }
  }

  // Дебаунсированная версия fetchSecrets
  const debouncedFetchSecrets = useCallback(
    debounce(fetchSecrets, 1000),
    []
  );

  // Интервал обновления
  useEffect(() => {
    console.log('App mounted, fetching secrets...');
    // Первоначальная загрузка секретов независимо от подключения кошелька
    fetchSecrets();
  }, []); // Пустой массив зависимостей

  // Также добавляем загрузку при изменении адреса
  useEffect(() => {
    if (address) {
      console.log('Address changed, fetching secrets...');
      fetchSecrets();
    }
  }, [address]); // Только address в зависимостях

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
      fetchSecrets();
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
    loading: fetchLoading,
    boostLikes,
    info,
    isAdmin: address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase(),
    deleteSecret,
    secrets: secrets,
    prevSecrets: secrets,
    submitSecret,
    likeSecret,
    cardStyle,
    fetchNextPage: () => {
      const now = Date.now();
      if (now - lastFetchTime > THROTTLE_DELAY) {
        lastFetchTime = now;
        fetchSecrets();
      }
    },
    hasNextPage,
    isFetchingNextPage,
    refetchSecrets: fetchSecrets,
  };

  const profileTabProps = {
    address,
    mySecrets,
    cardStyle,
    fetchSecrets: fetchSecrets,
  };

  useEffect(() => {
    console.log('Секреты для отображения:', secrets);
  }, [secrets]);

  return (
    <div className="app-container" style={{
      width: "100%",
      maxWidth: "100%",
      overflowX: "hidden",
      boxSizing: "border-box"
    }}>
      <div className="flex-col" style={{
        flex: 1,
        paddingTop: "var(--spacing-md)",
        paddingBottom: "calc(var(--button-height) + var(--spacing-xl))",
        textAlign: "center",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box"
      }}>
        <div className="flex-col" style={{
          maxWidth: "100%",
          margin: "0 auto",
          padding: "0 var(--spacing-md)",
          width: "100%",
          boxSizing: "border-box"
        }}>
          {activeTab === "home" && <HomeTab {...homeTabProps} />}
          {activeTab === "profile" && <ProfileTab {...profileTabProps} />}
          {activeTab === "gm" && <GmTab secrets={secrets} onStreakUpdate={handleStreakUpdate} />}
          {activeTab === "achievements" && (
            <AchievementsTab
              address={address}
              totalLikesGiven={totalLikesGiven}
              totalPosts={totalPosts}
              totalLikesReceived={totalLikesReceivedForAchievements}
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
    </div>
  );
}


