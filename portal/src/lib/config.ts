// Configuration for the interop protocol
// Uses environment variables with fallback defaults

export const SENDER_CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_SENDER_CHAIN_ID || "31337",
  10
);

export const RECEIVER_CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_RECEIVER_CHAIN_ID || "31338",
  10
);
