"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Wallet, AlertCircle, ArrowLeftRight } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useWeb3 } from "@/contexts/Web3Context";
import { ethers } from "ethers";
import {
  getOtherChainId,
  isConfiguredChain,
  getChainName,
  getRpcUrl,
  CHAIN_1_ID,
  CHAIN_2_ID,
} from "@/lib/contracts";

const MessageForm = () => {
  const [message, setMessage] = useState("");
  const [destination, setDestination] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [destinationChainId, setDestinationChainId] = useState<number | null>(null);

  const router = useRouter();
  const { account, contract, connectWallet, isConnecting, chainId } = useWeb3();

  // Auto-calculate destination chain when wallet chain changes
  useEffect(() => {
    if (chainId && isConfiguredChain(chainId)) {
      const otherChain = getOtherChainId(chainId);
      if (otherChain) {
        setDestinationChainId(otherChain);
      }
    }
  }, [chainId]);

  const isValidAddress = (address: string): boolean => {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  };

  const switchToChain = async (targetChainId: number) => {
    if (!window.ethereum) return;

    const chainIdHex = `0x${targetChainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (error) {
      const err = error as { code?: number };
      // Chain doesn't exist, add it
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
        } catch (addError) {
          console.error('Error adding chain:', addError);
          toast.error('Failed to add network');
        }
      } else {
        console.error('Error switching chain:', error);
        toast.error('Failed to switch network');
      }
    }
  };

  const handleSwapChains = async () => {
    if (!chainId) return;

    const otherChain = getOtherChainId(chainId);
    if (!otherChain) return;

    await switchToChain(otherChain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!contract) {
      toast.error("Contract not available", {
        description: "Please switch to a supported network",
      });
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    // Validate destination if provided
    if (destination && !isValidAddress(destination)) {
      toast.error("Please enter a valid destination address");
      return;
    }

    if (!destinationChainId) {
      toast.error("Destination chain not set", {
        description: "Please connect to a supported network",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Use address(0) if no destination specified
      const recipientAddress = destination || "0x0000000000000000000000000000000000000000";

      // Get the current nonce for this sender and destination chain
      const currentNonce = await contract.outgoingNonces(account, destinationChainId);

      // Convert message to bytes
      const encoder = new TextEncoder();
      const messageBytes = encoder.encode(message);
      const payloadHex = ethers.hexlify(messageBytes);

      // Call sendMessage function
      const tx = await contract.sendMessage(
        destinationChainId,
        recipientAddress,
        currentNonce,
        payloadHex
      );

      toast.success("Transaction submitted!", {
        description: "Redirecting to transaction details...",
      });

      // Redirect to transaction page with source and destination info
      router.push(`/tx/${tx.hash}?from=${chainId}&to=${destinationChainId}`);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!account && (
        <div className="mb-4 p-4 bg-muted border border-border rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">
            Connect your wallet to send cross-chain messages
          </p>
          <Button
            type="button"
            onClick={connectWallet}
            disabled={isConnecting}
            variant="portal"
            className="w-full"
          >
            <Wallet className="mr-2 h-5 w-5" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </div>
      )}

      {account && (
        <div className="mb-4 p-3 bg-muted border border-border rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Connected Account</p>
              <p className="text-sm font-mono">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>
            {chainId && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Chain ID</p>
                <p className="text-sm font-semibold">{chainId}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {account && chainId && !isConfiguredChain(chainId) && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive mb-2">
                Unsupported Network
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Please switch to one of the supported chains: {getChainName(CHAIN_1_ID)} ({CHAIN_1_ID}) or {getChainName(CHAIN_2_ID)} ({CHAIN_2_ID})
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => switchToChain(CHAIN_1_ID)}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  Switch to Chain {CHAIN_1_ID}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => switchToChain(CHAIN_2_ID)}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  Switch to Chain {CHAIN_2_ID}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {account && chainId && isConfiguredChain(chainId) && destinationChainId && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Sending from: {getChainName(chainId)} (Chain {chainId})
              </p>
              <p className="text-sm font-medium text-foreground">
                Destination: {getChainName(destinationChainId)} (Chain {destinationChainId})
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSwapChains}
              className="flex items-center gap-2"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Swap Chains
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="message" className="text-foreground font-medium">
          Message
        </Label>
        <Textarea
          id="message"
          placeholder="Enter your cross-chain message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[120px] bg-muted border-border focus:border-primary transition-smooth resize-none"
          disabled={!account}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="destination" className="text-foreground font-medium">
          Destination Address <span className="text-muted-foreground font-normal">(Optional)</span>
        </Label>
        <Input
          id="destination"
          type="text"
          placeholder="0x... (leave empty for address(0))"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className={`bg-muted border-border focus:border-primary transition-smooth ${
            destination && !isValidAddress(destination)
              ? "border-destructive focus:border-destructive"
              : ""
          }`}
          disabled={!account}
        />
        {destination && !isValidAddress(destination) && (
          <p className="text-sm text-destructive">Invalid EVM address format</p>
        )}
        <p className="text-xs text-muted-foreground">
          {destinationChainId
            ? `Messages will be sent to chain ${destinationChainId}. Leave empty to use address(0).`
            : "Connect to a supported network to send messages."}
        </p>
      </div>

      <Button
        type="submit"
        variant="portal"
        className="w-full h-12 text-base"
        disabled={!account || isSubmitting}
      >
        <Send className="mr-2 h-5 w-5" />
        {isSubmitting ? "Sending..." : "Send Cross-Chain Message"}
      </Button>
    </form>
  );
};

export default MessageForm;
