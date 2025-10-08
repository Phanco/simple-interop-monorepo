"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Copy, Home, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  RELAYERS,
  getSenderExplorer,
  getReceiverExplorer,
} from "@/lib/contracts";

interface TransactionPageProps {
  params: Promise<{
    txid: string;
  }>;
}

export default function TransactionPage({ params }: TransactionPageProps) {
  const { txid } = use(params);
  const [copied, setCopied] = useState(false);
  const [validatorSignatures, setValidatorSignatures] = useState<Record<string, boolean>>({});
  const [receiverChainCompleted, setReceiverChainCompleted] = useState(false);
  const [receiverChainHash, setReceiverChainHash] = useState<string | null>(null);

  // Poll validators every 2 seconds
  useEffect(() => {
    const pollValidators = async () => {
      const messageId = `${txid}`;

      for (const relayer of RELAYERS) {
        try {
          const response = await fetch(`${relayer.rpc}/message/${messageId}`);
          if (response.ok) {
            const data = await response.json();

            // Check if validator has signed
            if (data.signature) {
              setValidatorSignatures(prev => ({ ...prev, [relayer.name]: true }));
            }

            // Check if receiver chain transaction exists
            if (data.receiverChainHash) {
              setReceiverChainCompleted(true);
              setReceiverChainHash(data.receiverChainHash);
            }
          }
        } catch (error) {
          // Silently ignore errors - validator might not be ready yet
          console.log(`Failed to fetch from ${relayer.name}:`, error);
        }
      }
    };

    // Poll immediately and then every 2 seconds
    pollValidators();
    const interval = setInterval(pollValidators, 2000);

    return () => clearInterval(interval);
  }, [txid]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(txid);
      setCopied(true);
      toast.success("Transaction hash copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Transaction Submitted
            </h1>
            <p className="text-lg text-muted-foreground">
              Your cross-chain message has been submitted successfully
            </p>
          </div>

          {/* Transaction Details Card */}
          <div className="gradient-card rounded-xl border border-border shadow-card p-8 mb-6">
            <div className="space-y-6">
              {/* Transaction Hash Section */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Transaction Hash in Sender Chain
                </label>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <code className="flex-1 text-sm font-mono text-foreground break-all">
                      {txid}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`${getSenderExplorer()}${txid}`, "_blank")}
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Status Flow */}
              <div className="space-y-4">
                {/* Step 1: Transaction Submitted in Sender Chain */}
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="font-medium text-green-500">
                    Transaction Submitted in Sender Chain
                  </span>
                </div>

                {/* Step 2: Validators Status */}
                <div className="p-4 bg-muted/30 border border-border rounded-lg">
                  <div className="mb-3 font-medium text-foreground">Validators Status</div>
                  <div className="flex flex-wrap gap-2">
                    {RELAYERS.map((relayer) => {
                      const hasSigned = validatorSignatures[relayer.name] || false;
                      return (
                        <div
                          key={relayer.name}
                          className={`px-3 py-2 rounded-md border font-medium text-sm transition-colors ${
                            hasSigned
                              ? "text-green-500 border-green-500/50 bg-green-500/10"
                              : "text-red-500 border-red-500/50 bg-red-500/10"
                          }`}
                        >
                          {relayer.name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Transaction Submitted in Receiver Chain */}
                <div
                  className={`p-4 rounded-lg border transition-colors ${
                    receiverChainCompleted
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {receiverChainCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    )}
                    <span
                      className={`font-medium ${
                        receiverChainCompleted ? "text-green-500" : "text-muted-foreground"
                      }`}
                    >
                      Transaction Submitted in Receiver Chain
                    </span>
                  </div>
                </div>
                {receiverChainHash && <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Transaction Hash in Receiver Chain
                  </label>
                  <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <code className="flex-1 text-sm font-mono text-foreground break-all">
                        {receiverChainHash}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyToClipboard}
                        className="flex-shrink-0"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`${getReceiverExplorer()}${receiverChainHash}`, "_blank")}
                        className="flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="portal" className="w-full sm:w-auto">
                <Home className="mr-2 w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
