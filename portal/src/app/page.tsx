"use client";

import { useWeb3 } from "@/contexts/Web3Context";
import ChainDisplay from "@/components/ChainDisplay";
import MessageForm from "@/components/MessageForm";
import {
  getOtherChainId,
  isConfiguredChain,
  getChainName,
  getRpcUrl,
  CHAIN_1_ID,
  CHAIN_2_ID,
} from "@/lib/contracts";
import { toast } from "@/components/ui/sonner";

export default function Home() {
  const { chainId } = useWeb3();

  // Determine source and destination based on connected chain
  const sourceChainId = chainId && isConfiguredChain(chainId) ? chainId : CHAIN_1_ID;
  const destinationChainId = getOtherChainId(sourceChainId) || CHAIN_2_ID;

  const handleSwapChains = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected");
      return;
    }

    const targetChainId = destinationChainId;
    const chainIdHex = `0x${targetChainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (error) {
      const err = error as { code?: number };
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: getChainName(targetChainId),
              rpcUrls: [getRpcUrl(targetChainId)],
            }],
          });
        } catch {
          toast.error('Failed to add network');
        }
      } else {
        toast.error('Failed to switch network');
      }
    }
  };
  return (
    <div className="min-h-screen gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text">
            EVM Interoperability Portal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Seamlessly send cross-chain messages across EVM-compatible networks
          </p>
        </div>

        {/* Chain Display */}
        <ChainDisplay
          sourceChain={getChainName(sourceChainId)}
          destinationChain={getChainName(destinationChainId)}
          sourceChainId={sourceChainId}
          destinationChainId={destinationChainId}
          onSwap={handleSwapChains}
          canSwap={chainId !== null && isConfiguredChain(chainId)}
        />

        {/* Message Form Card */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="gradient-card rounded-xl border border-border shadow-card p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Send Message
            </h2>
            <MessageForm />
          </div>
        </div>
      </div>
    </div>
  );
}
