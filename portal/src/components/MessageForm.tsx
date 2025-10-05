"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const MessageForm = () => {
  const [message, setMessage] = useState("");
  const [destination, setDestination] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    toast.success("Message queued for cross-chain transmission", {
      description: `To: ${destination.slice(0, 6)}...${destination.slice(-4)}`,
    });

    // Reset form
    setMessage("");
    setDestination("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="destination" className="text-foreground font-medium">
          Destination Address
        </Label>
        <Input
          id="destination"
          type="text"
          placeholder="0x..."
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className={`bg-muted border-border focus:border-primary transition-smooth ${
            destination
              ? "border-destructive focus:border-destructive"
              : ""
          }`}
        />
        {destination && (
          <p className="text-sm text-destructive">Invalid EVM address format</p>
        )}
      </div>

      <Button
        type="submit"
        variant="portal"
        className="w-full h-12 text-base"
      >
        <Send className="mr-2 h-5 w-5" />
        Send Cross-Chain Message
      </Button>
    </form>
  );
};

export default MessageForm;
