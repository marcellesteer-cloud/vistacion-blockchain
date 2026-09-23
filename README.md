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

Each script records its address in `deploy-addresses.json`. The registry is initially empty apart from the target network and is populated as each deployment completes.

## Post-deployment treasury setup

After all contracts are deployed, configure the optional amounts in `.env` if needed:

```dotenv
STAKING_FUND_AMOUNT=1000000
ICO_SALE_AMOUNT=5000000
```

Then run the full funding and approval sequence with the treasury signer:

```bash
npm run post-deploy:treasury
```

The script will:

1. Verify that the network is Sepolia and that deployment addresses exist.
2. Require the configured treasury address to match the transaction signer.
3. Transfer enough VSC to Staking to reach `STAKING_FUND_AMOUNT`.
4. Approve the ICO contract for `ICO_SALE_AMOUNT` VSC.
5. Re-read and verify the Staking balance and ICO allowance.

The default amounts are examples, not production recommendations. Review the APR, sale price, sale duration, and treasury allocation before sending transactions. The script is idempotent for the configured targets: it does not transfer or approve again when the existing balance or allowance is already sufficient.

## Important notes

- The contracts are for development and review only; they have not been audited.
- Governance currently uses live balances; production governance should use snapshots, delegation, and timelocked execution.
- Use a multisig for treasury and privileged contract ownership.
- The token mints the fixed 21,000,000 VSC supply to the treasury and applies a configurable transfer burn.
- Staking must be funded before rewards can be claimed, and the ICO must have an approved VSC allowance before tokens can be sold.

See [`docs/architecture.md`](docs/architecture.md) for the system overview.
