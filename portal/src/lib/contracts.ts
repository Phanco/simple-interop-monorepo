// Contract configuration for MessageSender
import { SENDER_CHAIN_ID, RECEIVER_CHAIN_ID } from "./config";

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
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "nonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
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
  11155111: "0x1bEF4ff678ADbB41492850b746E1B98058aFB1bC",
  11155420: "0x4cbf76b09464125a9ef6638fA50dDF57f994C58a",
} as const;

// Placeholder RPC URLs - replace with actual RPC endpoints
export const RPC_URLS = {
  31337: "http://127.0.0.1:8545",
  31338: "http://127.0.0.1:8546",
  11155111: "https://sepolia.drpc.org",
  11155420: "https://sepolia.optimism.io",
} as const;

export const CHAIN_NAMES = {
  31337: "Anvil Testnet (Sender)",
  31338: "Anvil Testnet (Receiver)",
  11155111: "Sepolia Testnet",
  11155420: "OP Testnet (Sepolia)",
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
    rpc: "http://127.0.0.1:3000",
  },
  {
    name: "Balthasar-1",
    rpc: "http://127.0.0.1:3001",
  },
  {
    name: "Casper-2",
    rpc: "http://127.0.0.1:3002",
  },
];

// Helper functions to get chain-specific values
export function getSenderChainId(): number {
  return SENDER_CHAIN_ID;
}

export function getReceiverChainId(): number {
  return RECEIVER_CHAIN_ID;
}

export function getSenderChainName(): string {
  return CHAIN_NAMES[SENDER_CHAIN_ID as keyof typeof CHAIN_NAMES] || "Unknown Chain";
}

export function getReceiverChainName(): string {
  return CHAIN_NAMES[RECEIVER_CHAIN_ID as keyof typeof CHAIN_NAMES] || "Unknown Chain";
}

export function getSenderRpcUrl(): string {
  return RPC_URLS[SENDER_CHAIN_ID as keyof typeof RPC_URLS] || "";
}

export function getReceiverRpcUrl(): string {
  return RPC_URLS[RECEIVER_CHAIN_ID as keyof typeof RPC_URLS] || "";
}

export function getSenderExplorer(): string {
  return EXPLORERS[SENDER_CHAIN_ID as keyof typeof EXPLORERS] || "";
}

export function getReceiverExplorer(): string {
  return EXPLORERS[RECEIVER_CHAIN_ID as keyof typeof EXPLORERS] || "";
}

export function getSenderContractAddress(): string {
  return CONTRACT_ADDRESSES[SENDER_CHAIN_ID as keyof typeof CONTRACT_ADDRESSES] || "";
}

export function getReceiverContractAddress(): string {
  return CONTRACT_ADDRESSES[RECEIVER_CHAIN_ID as keyof typeof CONTRACT_ADDRESSES] || "";
}