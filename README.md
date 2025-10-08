# Simple Interop Monorepo

A simplified cross-chain messaging system that enables users to send messages from a source EVM chain to a destination EVM chain, with trusted off-chain relayers providing multi-signature attestation and message delivery.

## Project Overview

This project consist of 3 main components:
- **[Smart Contracts (Contract)](./contract/README.md)**: Solidity contracts for message sending and receiving with multi-signature verification
- **[Off-Chain Relayer Service (Validator)](./validator/README.md)**: TypeScript service that observes events, signs attestations, and delivers messages
- **[Web Interface (Portal)](./portal/README.md)**: Next.js portal for user interaction*

For detailed architecture and design decisions of each component, click the link above.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js v22+**
- **Foundry**
- **Docker**
- **Yarn**
- **PM2**

**Tested OS**: 
* MacOS
* Ubuntu Linux 24

## Quick Start

### 1. Clone Project

```bash
git clone git@github.com:Phanco/simple-interop-monorepo.git
cd simple-interop-monorepo
```

### 2. Start everything using bash script

Run:

```bash
./start_local
```

This script performs the following:
1. Starts 2 local Anvil blockchain instances:
   - **Source Chain**: Port 8545, Chain ID 31337
   - **Destination Chain**: Port 8546, Chain ID 31338
2. Deploys `MessageSender` contract to source chain
3. Deploys `MessageReceiver` contract to destination chain (with 3 relayer addresses, 2-of-3 threshold)
4. Starts 3 PostgreSQL database instances via Docker Compose (ports 5432, 5433, 5434)
5. Runs database migrations for all 3 validators
6. Starts 3 validator instances using PM2 (Names inspired by [MAGI](https://evangelion.fandom.com/wiki/Magi):
   - **Melchior** (validator-0): Port 3000
   - **Balthasar** (validator-1): Port 3001
   - **Casper** (validator-2): Port 3002
7. Starts the web portal on port 3003

### 3. Verify System is Running

Check that all services are operational:

```bash
pm2 status
```

Expected output:
```
┌─────┬──────────────┬─────────┬─────────┐
│ id  │ name         │ status  │ cpu     │
├─────┼──────────────┼─────────┼─────────┤
│ 0   │ validator-0  │ online  │ 0%      │
│ 1   │ validator-1  │ online  │ 0%      │
│ 2   │ validator-2  │ online  │ 0%      │
│ 3   │ portal       │ online  │ 0%      │
└─────┴──────────────┴─────────┴─────────┘
```

View validator logs:
```bash
pm2 logs
```

### 4. Send a Test Message

Use the integration script to send a cross-chain message:

```bash
./send_message "Hello World"
```

**This script does:**
1. Script calls `MessageSender.sendMessage()` on source chain (port 8545)
2. `MessageSent` event is emitted with your message
3. All 3 validators observe the event via their Monitor service
4. Each validator signs the message hash using their private key
5. The assigned validator (based on global nonce modulo) collects signatures from peers via HTTP
6. Once 2-of-3 signatures are collected, the assigned validator calls `MessageReceiver.receiveMessage()` on destination chain
7. Destination contract verifies signatures and stores the message

**Verification:**
Check validator logs to see the message being processed:
```bash
pm2 logs
```

Look for log entries showing:
- `Message Created with signature: <signature>`
- `Processing Message: <source_hash>`
- `Message: <source_hash> has reached enough signatures`
- `Message: <source_hash> broadcasted, txid: <dest_hash>`

### 5. Access the Web Portal

Open your browser to:
```
http://localhost:3003
```

Use the portal to:
- Send messages through a user-friendly interface
- Monitor message status (pending → broadcasting → completed)

## Project Structure

```
.
├── contract/             # Solidity Smart contracts
├── validator/            # TypeScript Relayer service
├── portal/               # Next.js Web interface
├── docker-compose.yml    # PostgreSQL instances
├── start_local           # Setup script
├── stop_local            # Teardown script
└── send_message          # Integration test script
```

## Stopping the System

To stop all services and clean up:

```bash
./stop_local
```

**This script does:**
1. Shutdown both Anvils local chain
2. Stop 3 validators
3. Stop portal
4. Remove Docker DB data by removing /postgres0, /postgres1, /postgres2

**Warning**: This script uses `rm -rf` to clean up data directories. All blockchain state and database data will be lost.
Removal of Docker data could fail in Linux environment, if so you can run `sudo rm -rf postgres*` manually.

## System Design

### Message Flow

1. **User Submits Message**: Calls `MessageSender.sendMessage()` on source chain
2. **Event Emission**: `MessageSent` event includes message data and global nonce
3. **Event Detection**: All 3 validators monitor source chain, detect event
4. **Signature Generation**: Each validator signs `keccak256(sourceChainId, destChainId, nonce, sender, recipient, payload)`
5. **Work Distribution**: Validator assigned via `globalNonce % 3` becomes broadcaster
6. **Signature Collection**: Assigned validator fetches signatures from peers via HTTP
7. **Threshold Check**: Once 2-of-3 signatures collected, proceed to submission
8. **Message Delivery**: Broadcaster calls `MessageReceiver.receiveMessage()` with signatures
9. **Verification**: Destination contract recovers signer addresses, verifies threshold, checks nonce
10. **Storage**: Message stored on destination chain, `MessageReceived` event emitted

### Trust Model

- **Multi-Signature Consensus**: Requires 2-of-3 relayer signatures (configurable threshold)
- **Relayer Rotation**:
  - Owner can replace relayers directly (centralized)
  - After ownership renounced, relayers vote for replacements (decentralized)
- **Replay Protection**: Sequential nonces per sender per chain
- **Byzantine Fault Tolerance**: System tolerates 1 compromised relayer (N-1 for N=3, threshold=2)

## If I have more time
My ideal chain-crossing messaging protocol would have the following features:
1. Oracle-Based Verification (Like lz)
2. Adjustable Verifiers (Increase/Decrease number of validators)
3. 2-way Interopability/Multi-Chain Support
4. Contract Calling instead of sending string message
5. Robust event listening (e.g. Using Subgraph)
6. Better Indexing of DB
7. A Second RPC as a fallback
8. Better error Handling and more robust failsafe system.
9. History of relayed Messages

## AI coding assistance
Claude Code is used to assist the development of this project.

### What works well
1. Portal is mostly vibe-coded. It serves it purpose with low security concern. Most of the time it can complete the instruction perfectly.
2. Applying comments to code.
3. Suggesting what is missing throughout the task by summerising the project.
4. Creating Documents!
5. Writing Bash Scripts.

### What works not-too-well
1. Solidity development are not done "Solidity-ly". So almost all Solidity part in this project are done by human.

## Staging Server
An example of the project can be reached at https://interop.fran.co

## License

MIT
