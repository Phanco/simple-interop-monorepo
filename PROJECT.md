# Scenario

Imagine a simplified, cross-chain messaging protocol. Users submit a message on a "source" EVM chain, and a trusted off-chain "relayer" service must observe this, sign an attestation to the message's validity, and
deliver it to a "destination" EVM chain. Your task is to build the core components for this protocol.

# Build

You must deliver the following components, running against two EVM chains of your choice. You may use two local chains (e.g., using Foundry's Anvil or Hardhat Network), two public testnets, or one of each:

## Smart Contracts
Provide minimal contracts that:
- accept a user message on a “source” chain and emit an event that a relayer can observe, and
- verify a relayer attestation on a “destination” chain before recording acceptance.

The contracts should be written in Solidity, using modern security practices (e.g., custom errors) and be reasonably gas-efficient. The attestation and replay protection approach is up to you. 

Explain your trust model and any rotation approach.

## Off-chain Relayer Service
Implement a small relayer that observes source-chain events, creates an attestation, and submits to the destination contract.

Should be written in either Rust or TypeScript.

The service should demonstrate sensible resilience measures. The exact strategy is up to you, but document your choices. 

# Testing
## Contracts 
Provide unit tests for the smart contracts using Foundry or Hardhat. These unit tests that cover acceptance and rejection paths for the attestation scheme you chose.

## Integration 
Include a simple script to demonstrate the full end-to-end flow: sending a message on the source chain and verifying it was successfully received and stored on the destination chain.
Constraints

Run locally or on a public EVM testnet. Mainnet is not allowed.

Use two chains overall. Your choice of local, testnet, or a mix.

Avoid paid or privileged infrastructure where possible.

The solution should be self-contained and require minimal, well-documented setup steps.
Reflection

In your DESIGN or README file, please include brief answers to these two
questions:

If I had more time: What would you extend or polish, and why? This could cover security, reliability, or testing.
AI coding assistance: If you used tools like Copilot or ChatGPT, what worked well and what did not for this task?

# Time and scope

You have one week to submit. We do not expect you to spend the full week. A few focused hours is fine. Prioritise clarity, completeness, and pragmatic scope.

# Submission

Please provide a link to a Git repository (e.g., on GitHub or GitLab)
containing:

All source code for the smart contracts and the relayer service.

Tests for all relevant components.

A README.md file with clear, step-by-step instructions on how to set up the environment, run the tests, and execute the end-to-end flow.

A short DESIGN.md or DECISIONS.md note explaining your key architectural choices and containing your answers to the Reflection questions.

If you use environment variables, include a .env.example file.

(Optional but helpful) A short (3 to 5 minute) screen recording where you walk through running the project and explain your work.