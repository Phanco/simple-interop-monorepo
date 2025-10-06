// Contract configuration for MessageSender

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
  // Optimism (Chain ID: 10)
  31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  // Sepolia Testnet (Chain ID: 11155111)
  31338: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
} as const;

// Placeholder RPC URLs - replace with actual RPC endpoints
export const RPC_URLS = {
  31337: "http://127.0.0.1:8545",
  31338: "http://127.0.0.1:8546",
  84532: "https://sepolia.base.org",
  11155420: "https://sepolia.optimism.io",
} as const;

export const CHAIN_NAMES = {
  31337: "Anvil Testnet (Sender)",
  31338: "Anvil Testnet (Receiver)",
  84532: "Base Testnet (Sepolia)",
  11155420: "OP Testnet (Sepolia)",
} as const;

export const EXPLORERS = {
  31337: "http://127.0.0.1:3000/tx/",
  31338: "http://127.0.0.1:3000/tx/",
  84532: "https://sepolia.basescan.org/tx/",
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
]