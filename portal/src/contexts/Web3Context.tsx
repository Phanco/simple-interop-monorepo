"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BrowserProvider, Contract, Eip1193Provider } from "ethers";
import { MESSAGE_SENDER_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { toast } from "@/components/ui/sonner";

interface Web3ContextType {
  provider: BrowserProvider | null;
  account: string | null;
  chainId: number | null;
  contract: Contract | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  account: null,
  chainId: null,
  contract: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isConnecting: false,
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("MetaMask not detected", {
        description: "Please install MetaMask to use this feature",
      });
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new BrowserProvider(window.ethereum as unknown as Eip1193Provider);

      // Request account access
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();

      const userAccount = accounts[0];
      const userChainId = Number(network.chainId);

      setProvider(browserProvider);
      setAccount(userAccount);
      setChainId(userChainId);

      // Initialize contract if address exists for this chain
      const contractAddress = CONTRACT_ADDRESSES[userChainId as keyof typeof CONTRACT_ADDRESSES];
      if (contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000") {
        const signer = await browserProvider.getSigner();
        const messageSenderContract = new Contract(contractAddress, MESSAGE_SENDER_ABI, signer);
        setContract(messageSenderContract);
      } else {
        setContract(null);
      }

      toast.success("Wallet connected", {
        description: `${userAccount.slice(0, 6)}...${userAccount.slice(-4)}`,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setAccount(null);
    setChainId(null);
    setContract(null);
    toast.info("Wallet disconnected");
  };

  // Listen for account and chain changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        toast.info("Account changed", {
          description: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);

      // Update contract for new chain
      if (provider) {
        const contractAddress = CONTRACT_ADDRESSES[newChainId as keyof typeof CONTRACT_ADDRESSES];
        if (contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000") {
          provider.getSigner().then((signer) => {
            const messageSenderContract = new Contract(contractAddress, MESSAGE_SENDER_ABI, signer);
            setContract(messageSenderContract);
          });
        } else {
          setContract(null);
        }
      }

      toast.info("Network changed", {
        description: `Chain ID: ${newChainId}`,
      });
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [provider]);

  const value: Web3ContextType = {
    provider,
    account,
    chainId,
    contract,
    connectWallet,
    disconnectWallet,
    isConnecting,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}