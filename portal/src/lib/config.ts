// Configuration for the interop protocol
// Uses environment variables with fallback defaults

export const CHAIN_1_ID = parseInt(
  process.env.NEXT_PUBLIC_CHAIN_1_ID || "31337",
  10
);

export const CHAIN_2_ID = parseInt(
  process.env.NEXT_PUBLIC_CHAIN_2_ID || "31338",
  10
);
