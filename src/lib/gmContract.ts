import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { withFailover, getPublicClient } from './contract';

// Адреса контракту GmStreak
export const GM_CONTRACT_ADDRESS = "0x399017dA3CF3B2A7148cEdc1C4Dc0228c03Cfb4C";

// Ініціалізуємо publicClient з failover
export const publicClient = getPublicClient();

// ABI для контракту GmStreak
export const GM_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "chainId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "currentStreak",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalCheckIns",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "CheckIn",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "errorMessage",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "ErrorOccurred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "chainId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "oldStreak",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newStreak",
				"type": "uint256"
			}
		],
		"name": "StreakUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "chainId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "newStatus",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "UserStatusChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "Withdrawn",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "CHECK_IN_PRICE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MAX_CHECKINS_PER_DAY",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MAX_STREAK",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MAX_TIME_BETWEEN_CHECKINS",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MIN_TIME_BETWEEN_CHECKINS",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "chainId",
				"type": "uint256"
			}
		],
		"name": "checkIn",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "checkInsPerDay",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getCheckInPrice",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getCurrentDay",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getCurrentTime",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "chainId",
				"type": "uint256"
			}
		],
		"name": "getUserStats",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "currentStreak",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalCheckIns",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lastCheckIn",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "longestStreak",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "chainId",
				"type": "uint256"
			}
		],
		"name": "resetStreak",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "chainId",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "status",
				"type": "bool"
			}
		],
		"name": "setUserStatus",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "chainId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "newStreak",
				"type": "uint256"
			}
		],
		"name": "updateStreak",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_newOracle",
				"type": "address"
			}
		],
		"name": "updateTimeOracle",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "userStatsByChain",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "currentStreak",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalCheckIns",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lastCheckIn",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "longestStreak",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
];

export async function getGmUserStats(userAddress: string, chainId: number) {
	try {
		const stats = await withFailover(client => client.readContract({
			address: GM_CONTRACT_ADDRESS,
			abi: GM_ABI,
			functionName: 'getUserStats',
			args: [userAddress, BigInt(chainId)],
		})) as [bigint, bigint, bigint, bigint, boolean];
		return {
			currentStreak: stats[0],
			totalCheckIns: stats[1],
			lastCheckIn: stats[2],
			longestStreak: stats[3],
			isActive: stats[4]
		};
	} catch (error) {
		return {
			currentStreak: BigInt(0),
			totalCheckIns: BigInt(0),
			lastCheckIn: BigInt(0),
			longestStreak: BigInt(0),
			isActive: false
		};
	}
}

export async function getGmCheckInPrice() {
	try {
		const price = await withFailover(client => client.readContract({
			address: GM_CONTRACT_ADDRESS,
			abi: GM_ABI,
			functionName: 'getCheckInPrice',
		}));
		return price;
	} catch (error) {
		return BigInt(0); // Default to 0 if an error occurs
	}
}

export async function getGmCurrentTime() {
	try {
		const time = await withFailover(client => client.readContract({
			address: GM_CONTRACT_ADDRESS,
			abi: GM_ABI,
			functionName: 'getCurrentTime',
		}));
		return time;
	} catch (error) {
		return BigInt(0); // Default to 0 if an error occurs
	}
}

export async function getGmCurrentDay() {
	try {
		const day = await withFailover(client => client.readContract({
			address: GM_CONTRACT_ADDRESS,
			abi: GM_ABI,
			functionName: 'getCurrentDay',
		}));
		return day;
	} catch (error) {
		return BigInt(0); // Default to 0 if an error occurs
	}
}

export const CHAIN_ID = 8453; // Base chain ID
export const MIN_TIME_BETWEEN_CHECKINS = 23 * 60 * 60; // 23 hours in seconds 