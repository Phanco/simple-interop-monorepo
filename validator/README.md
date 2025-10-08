# Off-Chain Relayer Service (Validator)

TypeScript service that observes events, signs attestations, and delivers cross-chain messages with multi-signature consensus.

## Overview

The validator is the core infrastructure component that bridges the source and destination EVM chains. It monitors blockchain events, generates cryptographic signatures, aggregates consensus from peer validators, and submits verified messages to the destination chain.

## Requirements

- **Node.js v22+**
- **PostgreSQL** (via Docker Compose)
- **PM2** (process manager)

## Design

### Architecture Components

The validator service consists of three core components that work together to provide reliable cross-chain message delivery:

#### 1. main.ts - HTTP Server & Entry Point

**Purpose**: Initializes the application, coordinates services, and provides HTTP API for health checks and message queries.

**Features**:
- Express HTTP server for peer communication
- `/health` endpoint for service status monitoring
- `/message/:id` endpoint for signature retrieval by peer validators
- Database synchronization and migration management
- Service initialization and coordination

**Startup Sequence**:
1. Sync database schema with Sequelize
2. Initialize NetworkControl (blockchain connections)
3. Initialize Broadcaster (message delivery)
4. Start Monitor (event observation)

#### 2. Monitor.ts - Event Observation Service

**Purpose**: Watches the source chain for `MessageSent` events and creates signed message records.

**Key Features**:
- **Batch Processing**: Queries events in batches of 100 blocks for efficiency
- **Block Confirmations**: Waits for 3 block confirmations before processing events (configurable via `MINIMUM_CONFIRMATION`)
- **Checkpoint Persistence**: Stores last processed block in database for crash recovery
- **Automatic Signature Generation**: Signs message hash using validator's private key
- **Polling Mechanism**: Continuously polls for new events with configurable intervals

**Event Processing Flow**:
1. Query events from `lastProcessedBlock + 1` to `currentBlock - 3`
2. For each `MessageSent` event:
   - Extract event parameters (sender, recipient, nonce, payload)
   - Generate message hash matching Solidity's `keccak256(abi.encodePacked(...))`
   - Sign message hash with validator's private key (ECDSA signature)
   - Store message in database with signature and status = 0 (pending)
3. Update `lastProcessedBlock` checkpoint

**Resilience**:
- Continuous retry on errors with error logging
- Block confirmation waiting prevents reorg issues
- Database persistence enables recovery after crashes

#### 3. Broadcaster.ts - Message Delivery Service

**Purpose**: Submits signed messages to the destination chain when consensus threshold is reached.

**Key Features**:
- **Work Distribution**: Only processes messages where `globalNonce % totalRelayers == relayerIndex`
- **Peer Signature Collection**: Fetches signatures from peer validators via HTTP
- **Threshold Verification**: Ensures consensus before submitting to destination chain
- **Nonce Ordering**: Enforces sequential message processing per sender
- **Status Tracking**: Updates message status (0: pending → 1: broadcasting → 2: completed) (3: invalid)

**Message Processing Flow**:
1. Query pending messages assigned to this validator
2. For each message:
   - Check on-chain nonce matches expected nonce
   - Skip if nonce not ready (enforces ordering)
   - Collect signatures from peer validators via HTTP
   - Verify threshold met (default 2-of-3 signatures)
   - Submit transaction to `MessageReceiver.receiveMessage()`
   - Wait for transaction confirmation
   - Update message status to completed

**Work Distribution Logic**:
```typescript
// Only process messages assigned to this validator
const assignedMessages = messages.filter(msg =>
  msg.globalNonce % totalRelayers === relayerIndex
);
```

#### 4. NetworkControl.ts - Blockchain Connection Manager

**Purpose**: Manages providers, signers, and contract instances for both source and destination chains.

**Features**:
- Initializes JsonRpcProvider for both chains
- Creates Contract instances with proper ABIs
- Manages wallet (signer) for transaction submission
- Loads network configuration from database

**Configuration**:
- Source chain (MessageSender contract)
- Destination chain (MessageReceiver contract)
- Wallet with validator private key

### Database Schema

The validator uses **PostgreSQL** with **Sequelize ORM** for data persistence.

#### Network Table
Stores blockchain network configuration:
- `chainId`: EVM chain ID
- `rpc`: RPC endpoint URL
- `senderContractAddress`: MessageSender contract address
- `receiverContractAddress`: MessageReceiver contract address
- `lastProcessedBlock`: Checkpoint for Monitor service
- `blockTime`: Block interval in seconds (for polling)

#### Message Table
Tracks cross-chain messages and their status:
- `messageId`: Unique identifier (`txHash-logIndex`)
- `fromNetworkId`: Source network FK
- `toNetworkId`: Destination network FK
- `sender`: Original sender address
- `nonce`: Message nonce
- `recipient`: Destination recipient address
- `payload`: Message data (bytes)
- `globalNonce`: Work distribution nonce
- `signature`: Validator's ECDSA signature
- `status`: 0 (pending), 1 (broadcasting), 2 (completed), 3 (skipped)
- `senderChainHash`: Source chain transaction hash
- `receiverChainHash`: Destination chain transaction hash

#### Peer Table
Stores peer validator endpoints for signature aggregation:
- `name`: Peer validator name
- `uri`: HTTP endpoint (e.g., `http://localhost:3001`)
- `fromNetworkId`: Source network FK
- `toNetworkId`: Destination network FK

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
LOGGER_LEVEL=debug
DB_HOST=127.0.0.1
DB_PORT=5432               # 5432, 5433, 5434 for each validator instance
DB_USERNAME=simple-interop
DB_PASSWORD=let-me-in
DB_DATABASE=simple-interop
SENDER_CHAIN_ID=31337
RECEIVER_CHAIN_ID=31338
NAME=validator-name        # Melchior, Balthasar, or Casper
PRIVATE_KEY=0x...          # Relayer signing key
PORT=3000                  # HTTP port (3000, 3001, 3002)
```

**Local Development** (Anvil defaults):
- **Validator 0 (Melchior)**: Port 3000, DB Port 5432, Private Key: `<Anvil #0 PrivateKey>`
- **Validator 1 (Balthasar)**: Port 3001, DB Port 5433, Private Key: `<Anvil #1 PrivateKey>`
- **Validator 2 (Casper)**: Port 3002, DB Port 5434, Private Key: `<Anvil #2 PrivateKey>`

## Installation

```bash
cd validator
yarn 
```

## Database Setup

### Run Migrations

```bash
DB_PORT=5432 yarn migrate
```

This creates the necessary tables (Network, Message, Peer) in PostgreSQL. And seed required network and peers data.

P.S.: The `start_local` script handles this automatically.

## Running the Validator

### Development Mode

```bash
pm2 start ecosystem.config.js
```

This starts 3 validator instances:
- **validator-0** (Melchior): Port 3000
- **validator-1** (Balthasar): Port 3001
- **validator-2** (Casper): Port 3002

### Monitor Logs

```bash
pm2 logs
```

### Stop Validators

```bash
pm2 stop ecosystem.config.js
```

## Deployment Architecture

The system runs **3 independent validator instances** using PM2 for process management:

Each validator:
1. Monitors source chain independently
2. Signs messages with own private key
3. Provides signatures to peers via HTTP API
4. Submits transactions when assigned via work distribution

## HTTP API

### Health Check

```bash
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "name": "Melchior-0"
}
```

### Query Message

```bash
GET /message/:txHash
```

**Parameters**:
- `txHash`: Source chain transaction hash

**Response**:
```json
{
  "messageId": "0xabc123...-5",
  "sender": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "recipient": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "payload": "0x48656c6c6f",
  "nonce": 0,
  "globalNonce": 0,
  "signature": "0x1234...",
  "status": 2,
  "senderChainHash": "0xabc123...",
  "receiverChainHash": "0xdef456..."
}
```

**Status Codes**:
- `0`: Pending (signature created, waiting for broadcasting)
- `1`: Broadcasting (transaction submitted, waiting for confirmation)
- `2`: Completed (transaction confirmed on destination chain)
- `3`: Invalid (nonce already processed)

## License

MIT