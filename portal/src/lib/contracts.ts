// Contract configuration for MessageSender
import { CHAIN_1_ID, CHAIN_2_ID } from "./config";

// Re-export chain IDs for convenience
export { CHAIN_1_ID, CHAIN_2_ID };

export const MESSAGE_SENDER_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "destinationChainId", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "bytes", name: "payload", type: "bytes" }
    ],
    name: "sendMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "destinationChainId", type: "uint256" },
      { indexed: true, internalType: "address", name: "sender", type: "address" },
      { indexed: true, internalType: "uint256", name: "nonce", type: "uint256" },
      { indexed: false, internalType: "address", name: "recipient", type: "address" },
      { indexed: false, internalType: "bytes", name: "payload", type: "bytes" },
      { indexed: false, internalType: "uint256", name: "globalNonce", type: "uint256" }
    ],
    name: "MessageSent",
    type: "event"
  },
  {
    type: "function",
    name: "outgoingNonces",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    inputs: [],
    name: "globalNonce",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Placeholder contract addresses - replace with actual deployed addresses
export const CONTRACT_ADDRESSES = {
  31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  31338: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  11155111: "0x6b5FD02Dc809c70f4A19FDd183EA95520EFCb678",
  11155420: "0x03795a3cfa3B6D356caE88Af798F72D45eD4aD0a",
} as const;

// Placeholder RPC URLs - replace with actual RPC endpoints
export const RPC_URLS = {
  31337: "http://127.0.0.1:8545",
  31338: "http://127.0.0.1:8546",
  11155111: "https://sepolia.drpc.org",
  11155420: "https://sepolia.optimism.io",
} as const;

export const CHAIN_NAMES = {
  31337: "Anvil Testnet 1",
  31338: "Anvil Testnet 2",
  11155111: "Sepolia Testnet",
  11155420: "OP Testnet (Sepolia)",
} as const;

export const CHAIN_SYMBOLS = {
   31337: "1",
   31338: "2",
   11155111: "Sep",
   11155420: "OP",
} as const;

export const NATIVE_CURRENCIES = {
  31337: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  31338: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  11155111: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  11155420: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
} as const;

export const EXPLORERS = {
  31337: "http://127.0.0.1:3000/tx/",
  31338: "http://127.0.0.1:3000/tx/",
  11155111: "https://sepolia.etherscan.io/tx/",
  11155420: "https://testnet-explorer.optimism.io/tx/",
} as const;

export const RELAYERS = [
  {
    name: "Melchior-0",
    rpc: "https://relayer0.fran.co",
  },
  {
    name: "Balthasar-1",
    rpc: "https://relayer1.fran.co",
  },
  {
    name: "Casper-2",
    rpc: "https://relayer2.fran.co",
  },
];

// Helper functions to get chain-specific values
export function getOtherChainId(currentChainId: number): number | null {
  if (currentChainId === CHAIN_1_ID) return CHAIN_2_ID;
  if (currentChainId === CHAIN_2_ID) return CHAIN_1_ID;
  return null;
}

export function isConfiguredChain(chainId: number): boolean {
  return chainId === CHAIN_1_ID || chainId === CHAIN_2_ID;
}

export function getChainName(chainId: number): string {
  return CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] || "Unknown Chain";
}

export function getRpcUrl(chainId: number): string {
  return RPC_URLS[chainId as keyof typeof RPC_URLS] || "";
}

export function getExplorer(chainId: number): string {
  return EXPLORERS[chainId as keyof typeof EXPLORERS] || "";
}

export function getContractAddress(chainId: number): string {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || "";
}

export function getConfiguredChainIds(): [number, number] {
  return [CHAIN_1_ID, CHAIN_2_ID];
}

export function getChainSymbol(chainId: number): string {
  return CHAIN_SYMBOLS[chainId as keyof typeof CHAIN_SYMBOLS] || "?";
}

export function getNativeCurrency(chainId: number) {
  return NATIVE_CURRENCIES[chainId as keyof typeof NATIVE_CURRENCIES] || {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  };
}