# Messenger Deployment Guide

## Prerequisites

1. Set up your environment variables in `.env` file based on `.env.example`:
   - `PRIVATE_KEY`: Deployer's private key
   - `OWNER`: Address that will own the Messenger contract
   - `RELAYERS`: Comma-separated list of relayer addresses
   - `THRESHOLD`: Minimum number of signatures required

## Example .env

```bash
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
OWNER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
RELAYERS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,0x70997970C51812dc3A010C7d01b50e0d17dc79C8,0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
THRESHOLD=2
```

## Deploy Messenger Contract

### To a local network (Anvil)

```bash
# Start Anvil in a separate terminal
anvil

# Deploy the contract
forge script script/Messenger.s.sol:DeployMessenger --rpc-url http://127.0.0.1:8545 --broadcast
```

### To a testnet (e.g., Sepolia)

```bash
forge script script/Messenger.s.sol:DeployMessenger \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### To mainnet

```bash
forge script script/Messenger.s.sol:DeployMessenger \
  --rpc-url $MAINNET_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## Deployment Output

The deployment script will:

1. Display deployer, owner, relayers, and threshold information
2. Deploy the Messenger contract
3. Verify deployment parameters (owner, relayers, threshold)
4. Save deployment info to `./deployment/{chainId}/Messenger.json`
5. Display the deployed contract address

## Using the Deployed Contract

After deployment, you can interact with the Messenger contract for:

- **Sending messages**: Call `sendMessage(destinationChainId, recipient, nonce, payload)`
- **Receiving messages**: Call `receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures)`
- **Receiving ACKs**: Call `receiveAck(destinationChainId, nonce, sender, recipient, payload, signatures)`
- **Managing relayers**: Call `updateRelayer(oldRelayer, newRelayer)` (owner or consensus)
