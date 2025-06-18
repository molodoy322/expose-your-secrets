import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

// Список RPC-эндпоинтов берём из .env (или используем дефолтные)
const RPC_ENDPOINTS = [
	'https://base-mainnet.infura.io/v3/9010eab5407747c68ac69b02ffee4255',
	'https://rpc.ankr.com/base/f22bcb8bf9f5467e7fd90dc9f165e8f052cd31b37e663494457256fdc5540f33',
	'https://rpc.ankr.com/base/1986b1a324ed8485c49af459da86f1ec63b5f186ef7b87e83ba59a7396f33b52',
	'https://base-mainnet.infura.io/v3/9741d204a8af41669ea24454ebca7978',
	'https://mainnet.base.org',
].filter(Boolean);

let currentRpcIndex = 0;

function createClientWithIndex(idx: number) {
	return createPublicClient({
		chain: base,
		transport: http(RPC_ENDPOINTS[idx])
	});
}

// Универсальная обёртка для любого метода viem
export async function withFailover(fn) {
	let lastError;
	for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
		const client = createClientWithIndex(i);
		try {
			return await fn(client);
		} catch (e) {
			lastError = e;
			console.warn(`RPC endpoint failed, switching to next: ${RPC_ENDPOINTS[i]}`);
		}
	}
	throw lastError;
}

export function getPublicClient() {
	let client = createClientWithIndex(currentRpcIndex);
	return {
		async request(method: string, params: any[] = []) {
			let tries = 0;
			let lastError;
			while (tries < RPC_ENDPOINTS.length) {
				try {
					// @ts-ignore
					return await client.request({ method, params });
				} catch (e) {
					lastError = e;
					tries++;
					if (tries < RPC_ENDPOINTS.length) {
						currentRpcIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.length;
						client = createClientWithIndex(currentRpcIndex);
						console.warn(`RPC endpoint failed, switching to next: ${RPC_ENDPOINTS[currentRpcIndex]}`);
					}
				}
			}
			// Только если все RPC не сработали — выбрасываем ошибку
			throw lastError;
		},
		// Проксируем остальные методы viem publicClient
		...client
	};
}

// Для обратной совместимости (старый publicClient)
export const publicClient = getPublicClient();

// Основна адреса контракту
export const CONTRACT_ADDRESS = "0xC786be8d7aa704bf274B155Cb60CBFE4D3c50D5d";

// Новий повний ABI:
export const ABI = [
	{
		"inputs": [
			{ "internalType": "string", "name": "text", "type": "string" }
		],
		"name": "addSecret",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "id", "type": "uint256" }
		],
		"name": "boostLikes",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "id", "type": "uint256" }
		],
		"name": "deleteSecret",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
			{ "indexed": true, "internalType": "address", "name": "by", "type": "address" }
		],
		"name": "LikeBoosted",
		"type": "event"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "id", "type": "uint256" }
		],
		"name": "likeSecret",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
			{ "indexed": false, "internalType": "string", "name": "text", "type": "string" },
			{ "indexed": true, "internalType": "address", "name": "author", "type": "address" }
		],
		"name": "SecretAdded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
			{ "indexed": true, "internalType": "address", "name": "by", "type": "address" }
		],
		"name": "SecretDeleted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
			{ "indexed": true, "internalType": "address", "name": "liker", "type": "address" },
			{ "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
		],
		"name": "SecretLiked",
		"type": "event"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "user", "type": "address" },
			{ "internalType": "bool", "name": "blockStatus", "type": "bool" }
		],
		"name": "setBlock",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "user", "type": "address" },
			{ "indexed": false, "internalType": "bool", "name": "blocked", "type": "bool" }
		],
		"name": "UserBlocked",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "id", "type": "uint256" }
		],
		"name": "getSecret",
		"outputs": [
			{ "internalType": "string", "name": "", "type": "string" },
			{ "internalType": "uint256", "name": "", "type": "uint256" },
			{ "internalType": "address", "name": "", "type": "address" },
			{ "internalType": "uint256", "name": "", "type": "uint256" },
			{ "internalType": "bool", "name": "", "type": "bool" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getSecretsCount",
		"outputs": [
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "user", "type": "address" }
		],
		"name": "getUserStats",
		"outputs": [
			{ "internalType": "uint256", "name": "secretsPosted", "type": "uint256" },
			{ "internalType": "uint256", "name": "likesGiven", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "", "type": "address" }
		],
		"name": "isBlocked",
		"outputs": [
			{ "internalType": "bool", "name": "", "type": "bool" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "LIKE_BOOST_PRICE",
		"outputs": [
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "LIKE_PRICE",
		"outputs": [
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "", "type": "address" },
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"name": "likeBoostUsedToday",
		"outputs": [
			{ "internalType": "bool", "name": "", "type": "bool" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "", "type": "address" },
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"name": "likesPerDay",
		"outputs": [
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MAX_LIKES_PER_DAY",
		"outputs": [
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MAX_POSTS_PER_DAY",
		"outputs": [
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MAX_SECRET_LENGTH",
		"outputs": [
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{ "internalType": "address", "name": "", "type": "address" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "POST_PRICE",
		"outputs": [
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "", "type": "address" },
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"name": "postsPerDay",
		"outputs": [
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"name": "secrets",
		"outputs": [
			{ "internalType": "string", "name": "text", "type": "string" },
			{ "internalType": "uint256", "name": "likes", "type": "uint256" },
			{ "internalType": "address", "name": "author", "type": "address" },
			{ "internalType": "uint256", "name": "timestamp", "type": "uint256" },
			{ "internalType": "bool", "name": "deleted", "type": "bool" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "", "type": "address" }
		],
		"name": "totalLikesGiven",
		"outputs": [
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "", "type": "address" }
		],
		"name": "totalSecretsPosted",
		"outputs": [
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"stateMutability": "view",
		"type": "function"
	}
];

export async function getPostsToday(address: string, today: number) {
	return await withFailover(client => client.readContract({
		address: CONTRACT_ADDRESS,
		abi: ABI,
		functionName: "postsPerDay",
		args: [address, today],
	}));
}

export async function getLikesToday(address: string, today: number) {
	return await withFailover(client => client.readContract({
		address: CONTRACT_ADDRESS,
		abi: ABI,
		functionName: "likesPerDay",
		args: [address, today],
	}));
}

// --- Stats по користувачу (від контракту) ---
export async function getUserStats(address: string) {
	return await withFailover(client => client.readContract({
		address: CONTRACT_ADDRESS,
		abi: ABI,
		functionName: "getUserStats",
		args: [address],
	}));
}
