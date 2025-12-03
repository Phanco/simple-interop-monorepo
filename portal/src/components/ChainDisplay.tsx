"use client";

import { ArrowRight, ArrowLeftRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getChainSymbol, getChainName, getRpcUrl, getNativeCurrency } from "@/lib/contracts";
import { toast } from "@/components/ui/sonner";

interface ChainDisplayProps {
  sourceChain: string;
  destinationChain: string;
  sourceChainId?: number;
  destinationChainId?: number;
  onSwap?: () => void;
  canSwap?: boolean;
}

const ChainDisplay = ({
  sourceChain,
  destinationChain,
  sourceChainId,
  destinationChainId,
  onSwap,
  canSwap = false
}: ChainDisplayProps) => {
  const addToMetaMask = async (chainId: number) => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected");
      return;
    }

    const chainIdHex = `0x${chainId.toString(16)}`;
    const chainName = getChainName(chainId);
    const rpcUrl = getRpcUrl(chainId);
    const nativeCurrency = getNativeCurrency(chainId);

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: chainName,
          rpcUrls: [rpcUrl],
          nativeCurrency: nativeCurrency,
        }],
      });
      toast.success(`${chainName} added to MetaMask`);
    } catch (error) {
      console.error('Error adding chain to MetaMask:', error);
      const err = error as { code?: number };
      if (err.code === 4001) {
        toast.error("You rejected the request");
      } else {
        toast.error("Failed to add network to MetaMask");
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-6 mb-8">
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-glow mb-3">
          <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {sourceChainId ? getChainSymbol(sourceChainId) : "S"}
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Source Chain</p>
          <p className="font-semibold text-foreground">{sourceChain}</p>
          {sourceChainId && (
            <p className="text-xs text-muted-foreground mt-1">Chain ID: {sourceChainId}</p>
          )}
        </div>
        {sourceChainId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => addToMetaMask(sourceChainId)}
            className="mt-2 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add to MetaMask
          </Button>
        )}
      </div>

      {onSwap ? (
        <Button
          variant="outline"
          size="icon"
          onClick={onSwap}
          disabled={!canSwap}
          className="w-12 h-12 rounded-full border-2 border-primary bg-card hover:bg-primary/10"
          title="Swap chains"
        >
          <ArrowLeftRight className="w-6 h-6 text-primary" />
        </Button>
      ) : (
        <ArrowRight className="w-8 h-8 text-primary animate-pulse" />
      )}

      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-glow mb-3">
          <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
            <span className="text-2xl font-bold text-secondary">
              {destinationChainId ? getChainSymbol(destinationChainId) : "R"}
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Destination Chain</p>
          <p className="font-semibold text-foreground">{destinationChain}</p>
          {destinationChainId && (
            <p className="text-xs text-muted-foreground mt-1">Chain ID: {destinationChainId}</p>
          )}
        </div>
        {destinationChainId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => addToMetaMask(destinationChainId)}
            className="mt-2 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add to MetaMask
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChainDisplay;
