module.exports = {
  apps: [
    {
      name: 'validator-0',
      script: 'yarn dev',
      env: { PORT: 3000, DB_PORT: 5432, SENDER_CHAIN_ID: 11155111, RECEIVER_CHAIN_ID: 11155420, NAME: "Melchior-0", PRIVATE_KEY: '0x2f0fd28fcdcdb4462ad2d28f4d4ffc330aa8cb966f638a1377479d2d99904cc3' }
    },
    {
      name: 'validator-1',
      script: 'yarn dev',
      env: { PORT: 3001, DB_PORT: 5433, SENDER_CHAIN_ID: 11155111, RECEIVER_CHAIN_ID: 11155420, NAME: "Balthasar-1", PRIVATE_KEY: '0x90dd2a39ea0a36703a77e010305a0ce1fe3ee47a8023e5ab721e2d690c6077a8' }
    },
    {
      name: 'validator-2',
      script: 'yarn dev',
      env: { PORT: 3002, DB_PORT: 5434, SENDER_CHAIN_ID: 11155111, RECEIVER_CHAIN_ID: 11155420, NAME: "Casper-2", PRIVATE_KEY: '0x6aa92c920fe6039780b035c9aadd4b38a86256c7e8b0eb6caf1ec043fc7bbbd4' }
    }
  ]
}
