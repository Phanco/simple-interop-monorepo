import ChainDisplay from "@/components/ChainDisplay";
import MessageForm from "@/components/MessageForm";
import {
  getSenderChainId,
  getReceiverChainId,
  getSenderChainName,
  getReceiverChainName,
} from "@/lib/contracts";

export default function Home() {
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
          sourceChain={getSenderChainName()}
          destinationChain={getReceiverChainName()}
          sourceChainId={getSenderChainId()}
          destinationChainId={getReceiverChainId()}
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
