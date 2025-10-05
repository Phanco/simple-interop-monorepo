module.exports = {
  apps: [
    {
      name: 'validator-0',
      script: 'yarn dev',
      env: { PORT: 3000, DB_PORT: 5432, NAME: "Melchior-0", PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' }
    },
    {
      name: 'validator-1',
      script: 'yarn dev',
      env: { PORT: 3001, DB_PORT: 5433, NAME: "Balthasar-1", PRIVATE_KEY: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' }
    },
    {
      name: 'validator-2',
      script: 'yarn dev',
      env: { PORT: 3002, DB_PORT: 5434, NAME: "Casper-2", PRIVATE_KEY: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' }
    }
  ]
}
