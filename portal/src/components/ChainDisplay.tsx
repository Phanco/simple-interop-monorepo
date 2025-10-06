"use client";

import { ArrowRight } from "lucide-react";

interface ChainDisplayProps {
  sourceChain: string;
  destinationChain: string;
  sourceChainId?: number;
  destinationChainId?: number;
}

const ChainDisplay = ({
  sourceChain,
  destinationChain,
  sourceChainId,
  destinationChainId
}: ChainDisplayProps) => {
  return (
    <div className="flex items-center justify-center gap-6 mb-8">
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-glow mb-3">
          <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">S</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Source Chain</p>
          <p className="font-semibold text-foreground">{sourceChain}</p>
          {sourceChainId && (
            <p className="text-xs text-muted-foreground mt-1">Chain ID: {sourceChainId}</p>
          )}
        </div>
      </div>

      <ArrowRight className="w-8 h-8 text-primary animate-pulse" />

      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-glow mb-3">
          <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
            <span className="text-2xl font-bold text-secondary">R</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Destination Chain</p>
          <p className="font-semibold text-foreground">{destinationChain}</p>
          {destinationChainId && (
            <p className="text-xs text-muted-foreground mt-1">Chain ID: {destinationChainId}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChainDisplay;
