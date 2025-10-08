# Simple Interop (Portal)

Next.js portal for user interaction with the cross-chain messaging protocol.

## Overview

The portal is a modern, responsive web interface that enables users to send cross-chain messages through a user-friendly interface. Built with Next.js 15, React 19, and Tailwind CSS, it provides seamless wallet integration and real-time message tracking.

## Requirements

- **Node.js v22+**
- **Yarn** (recommended) or npm
- **MetaMask** or compatible Web3 wallet browser extension

## Design

### UI Components (Shadcn/ui)

The portal uses [shadcn/ui](https://ui.shadcn.com/) components for consistent, accessible UI:

- **Button**: Primary action button with variants
- **Input**: Text input with validation styling
- **Textarea**: Multi-line text input
- **Label**: Form field labels
- **Toast (Sonner)**: Non-intrusive notifications
- **Table**: Message history display
- **Badge**: Status indicators

### Styling

**Tailwind CSS v4** with custom design token

## Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
PORT=3003
NEXT_PUBLIC_SENDER_CHAIN_ID=31337
NEXT_PUBLIC_RECEIVER_CHAIN_ID=31338
```

**Variables**:
- `PORT`: Running port
- `NEXT_PUBLIC_SENDER_CHAIN_ID`: Source chain ID (31337 for local Anvil)
- `NEXT_PUBLIC_RECEIVER_CHAIN_ID`: Destination chain ID (31338 for local Anvil)

## Installation

```bash
cd portal
yarn
```

## Development

### Start Development Server

```bash
PORT=3003 yarn dev
```

The portal will be available at `http://localhost:3003`

## Usage

### Connecting Wallet

1. Click "Connect Wallet" button
2. Approve MetaMask connection request
3. Portal displays connected account and chain ID

### Sending a Message

1. Ensure wallet is connected
2. Verify you're on the source chain (or click "Switch to Chain X")
3. Enter your message in the text area
4. (Optional) Enter destination address on target chain
5. Click "Send Cross-Chain Message"
6. Approve transaction in MetaMask
7. Portal redirects to transaction details page

### Monitoring Transaction

After sending a message:
1. Transaction details page displays source transaction hash
2. System polls validator service for message status
3. Once validators process message, destination transaction hash appears
4. Status updates from "Pending" → "Processing" → "Completed"

## License

MIT
