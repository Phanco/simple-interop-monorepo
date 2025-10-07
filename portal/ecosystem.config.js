module.exports = {
  apps: [
    {
      name: 'portal',
      script: 'yarn dev',
      env: {
        PORT: 3003,
        NEXT_PUBLIC_SENDER_CHAIN_ID: 31337,
        NEXT_PUBLIC_RECEIVER_CHAIN_ID: 31338
      }
    }
  ]
}
