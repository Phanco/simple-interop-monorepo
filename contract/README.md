# Smart Contracts (Contract)

Solidity smart contracts for cross-chain message sending and receiving with multi-signature verification.

## Overview

The contract component consists of two core smart contracts that enable cross-chain messaging between EVM chains with multi-signature attestation from off-chain relayers.

## Design

### MessageSender.sol

**Purpose**: Deployed on the source chain to accept user messages and emit events for relayers to observe.

**Key Features**:
- **Nonce Management**: Tracks per-sender, per-destination-chain nonces to ensure message ordering and prevent replay attacks
- **Global Nonce**: Assigns a sequential global nonce for work distribution among relayers
- **Event Emission**: Emits `MessageSent` events containing all message data for off-chain observers
- **Validation**: Validates destination chain, payload, and nonce before accepting messages

**State Variables**:
- `globalNonce`: Global counter incremented with each message, used for relayer work distribution
- `nonces`: Mapping of `sender => destinationChainId => nonce` for replay protection

**Core Function**:
```solidity
function sendMessage(
    uint256 destinationChainId,
    address recipient,
    uint256 nonce,
    bytes calldata payload
) public
```

**Security Practices**:
- Custom errors for gas efficiency (`InvalidDestinationChain`, `EmptyPayload`, `InvalidNonce`)
- Strict nonce sequencing prevents message replay
- Input validation on all parameters

### MessageReceiver.sol

**Purpose**: Deployed on the destination chain to verify multi-signature attestations and accept messages.

**Key Features**:
- **Multi-Signature Verification**: Requires threshold consensus from registered relayers (2-of-3 by default)
- **Replay Protection**: Tracks processed nonces per source chain and sender
- **ECDSA Signature Recovery**: Uses OpenZeppelin's ECDSA library for cryptographic verification
- **Dynamic Relayer Management**: Supports relayer rotation through owner action or consensus voting

**State Variables**:
- `CONSENSUS_THRESHOLD`: Immutable minimum number of signatures required
- `relayers`: Array of authorized relayer addresses
- `relayersMap`: Mapping for O(1) relayer lookup
- `processedMessageNonces`: Mapping of `sourceChainId => sender => nonce` for replay protection
- `messages`: Array storing all received messages
- `currentProposals`: Tracks each relayer's vote for replacement proposals
- `votes`: Counts votes for each replacement proposal

**Core Functions**:
```solidity
function receiveMessage(
    uint256 sourceChainId,
    uint256 nonce,
    address sender,
    address recipient,
    bytes calldata payload,
    bytes[] calldata signatures
) external
```

**Trust Model**:
- **Initial Setup**: Owner deploys contract with a set of trusted relayer addresses and a consensus threshold
- **Consensus Threshold**: Requires N-of-M signatures (configurable, default 2-of-3)
- **Relayer Rotation**:
  - Owner can update relayers directly (centralized)
  - After ownership is renounced, relayers can vote to replace themselves (decentralized)
  - Prevents single point of failure in relayer compromise scenarios

**Security Practices**:
- OpenZeppelin's `Ownable` for access control
- Bit-masking to prevent duplicate relayer signatures
- Message hash verification using EIP-191 standard (Ethereum Signed Message)
- Nonce-based replay protection
- Custom errors for gas efficiency

## Implementation Details

### Message Hash Generation

Both contracts use a consistent hashing scheme for message integrity:

```solidity
bytes32 messageHash = keccak256(
    abi.encodePacked(
        sourceChainId,
        destinationChainId,
        nonce,
        sender,
        recipient,
        payload
    )
).toEthSignedMessageHash();  // Applies EIP-191 prefix
```

### Signature Verification Flow

1. Contract receives message with array of signatures
2. For each signature:
   - Recover signer address using ECDSA.recover()
   - Verify signer is a registered relayer
   - Check relayer hasn't already signed (using bitmask)
   - Increment valid signature count
3. Verify threshold is met (`validSignatures >= CONSENSUS_THRESHOLD`)
4. Store message and emit event

### Nonce System

**Per-Sender Nonces** (`MessageSender`):
- Each sender has independent nonce sequence per destination chain
- Ensures messages from same sender are processed in order
- Prevents replay attacks

**Global Nonce** (`MessageSender`):
- Single incrementing counter for all messages
- Used for work distribution: `assignedRelayer = globalNonce % totalRelayers`
- Prevents multiple relayers from submitting same message

**Processed Nonces** (`MessageReceiver`):
- Tracks next expected nonce per sender per source chain
- Rejects messages with incorrect nonce (too early or replay)

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PRIVATE_KEY=0xabc          # Deployer private key
OWNER=0xabc                # MessageReceiver owner address
RELAYERS=0xabc,0xdef,0x123 # Comma-separated relayer addresses (3 addresses)
THRESHOLD=2                # Signature threshold (2-of-3)
```

## Build

Compile contracts using Foundry:

```bash
cd contract
forge build
```

## Test

Run comprehensive test suite:

```bash
forge test
```

Generate coverage report:

```bash
forge coverage --report summary
```

### Test Coverage

The project includes comprehensive Foundry tests with 100% coverage for core contracts.

**MessageSender.sol**:
- Invalid destination chain validation (chain ID 0, same as current chain)
- Empty payload rejection
- Nonce sequencing and validation
- Successful message emission
- Event parameter verification
- Global nonce incrementation

**MessageReceiver.sol**:
- Multi-signature verification (2-of-3 threshold)
- Successful message reception with valid signatures
- Handling oversupplied signatures (3 provided when 2 required)
- Duplicate signature detection and rejection
- Insufficient signatures rejection
- Nonce-based replay protection
- Relayer index retrieval
- Owner-based relayer updates
- Consensus-based relayer rotation (when owner is zero address)
- Prevention of unauthorized relayer updates
- Prevention of duplicate relayer addresses

## Deployment

### Deploy MessageSender (Source Chain)

```bash
forge script script/MessageSender.s.sol:MessageSenderScript \
    --rpc-url <SOURCE_CHAIN_RPC> \
    --broadcast \
    --verify
```

### Deploy MessageReceiver (Destination Chain)

```bash
forge script script/MessageReceiver.s.sol:MessageReceiverScript \
    --rpc-url <DESTINATION_CHAIN_RPC> \
    --broadcast \
    --verify
```

## Gas Optimization

**MessageSender**:
- Custom errors instead of revert strings
- Minimal storage operations
- Event-based communication (no storage of message data)

**MessageReceiver**:
- Bit-masking for duplicate detection (no array/mapping storage)
- Unchecked arithmetic in safe loops
- Storage-packed Message struct

## Security Considerations

**Byzantine Fault Tolerance**:
- System tolerates up to `N - THRESHOLD` compromised relayers
- Default 2-of-3 configuration tolerates 1 compromised relayer
- Relayer rotation allows recovery from compromise

## Dependencies

- **OpenZeppelin Contracts**:
  - `Ownable.sol`: Access control for relayer management
  - `ECDSA.sol`: Signature recovery and verification
  - `MessageHashUtils.sol`: EIP-191 message hashing

- **Forge-std**: Foundry testing utilities

## License

MIT
