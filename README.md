# Vistacion Blockchain (VSC)

![Solidity](https://img.shields.io/badge/Solidity-0.8.x-blue.svg)
![Hardhat](https://img.shields.io/badge/Hardhat-ready-yellow.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

Vistacion (VSC) is a deflationary ERC-20 token with staking, escrow, governance, and ICO contracts, designed to evolve into a full commodity-backed, Proof-of-Stake ecosystem.

## Quick start

```bash
npm install
cp .env.example .env
npx hardhat compile
npx hardhat test
```

Configure `.env` with a Sepolia RPC URL, deployer key, treasury address, and oracle address before deploying. Never commit `.env`, private keys, or funded wallet seed phrases.

## Sepolia deployment

Deploy in dependency order:

```bash
npm run deploy:token
npm run deploy:staking
npm run deploy:escrow
npm run deploy:governance
npm run deploy:ico
```

Each script records its address in `deploy-addresses.json`. The ICO also requires the treasury to transfer or approve VSC for the ICO contract before sales begin. Staking must be funded with VSC before rewards can be claimed.

## Important notes

- The contracts are for development and review only; they have not been audited.
- Governance currently uses live balances; production governance should use snapshots, delegation, and timelocked execution.
- Use a multisig for treasury and privileged contract ownership.
- The token mints the fixed 21,000,000 VSC supply to the treasury and applies a configurable transfer burn.

See [`docs/architecture.md`](docs/architecture.md) for the system overview.
