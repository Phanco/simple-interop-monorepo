"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockMessages = [
  {
    id: "1",
    message: "Hello from Ethereum!",
    destination: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    status: "Confirmed",
    timestamp: "2 min ago",
  },
  {
    id: "2",
    message: "Cross-chain NFT transfer",
    destination: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    status: "Pending",
    timestamp: "5 min ago",
  },
  {
    id: "3",
    message: "Token bridge request",
    destination: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
    status: "Confirmed",
    timestamp: "12 min ago",
  },
];

const RecentMessages = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Recent Messages</h2>
      <div className="gradient-card rounded-lg border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground font-semibold">Message</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Destination</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockMessages.map((msg) => (
              <TableRow
                key={msg.id}
                className="border-border hover:bg-muted/50 transition-smooth"
              >
                <TableCell className="font-medium text-foreground">{msg.message}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {msg.destination.slice(0, 6)}...{msg.destination.slice(-4)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={msg.status === "Confirmed" ? "default" : "secondary"}
                    className={
                      msg.status === "Confirmed"
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-secondary/20 text-secondary border-secondary/30"
                    }
                  >
                    {msg.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-right">{msg.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RecentMessages;
