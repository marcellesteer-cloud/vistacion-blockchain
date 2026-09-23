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

Before enabling staking or the ICO, use the treasury wallet to perform these two on-chain setup actions:

1. **Fund Staking with VSC.** Transfer enough VSC from the treasury to the deployed Staking address so the contract can pay accrued rewards.
2. **Approve the ICO.** Approve the deployed ICO address to spend the intended VSC sale inventory from the treasury.

The exact amounts are deployment and token-allocation decisions; do not copy production amounts from examples without reviewing the sale and reward parameters. Retrieve the deployed addresses from `deploy-addresses.json` and verify every address on Sepolia before submitting transactions.

Using Hardhat’s console with the configured Sepolia environment:

```bash
npx hardhat console --network sepolia
```

```js
const fs = require("fs");
const addresses = JSON.parse(fs.readFileSync("deploy-addresses.json", "utf8"));
const [treasury] = await ethers.getSigners();
const token = await ethers.getContractAt("VistacionToken", addresses.token, treasury);

// Choose and review this amount before sending the transaction.
const stakingAmount = ethers.parseEther("1000000");
await (await token.transfer(addresses.staking, stakingAmount)).wait();

// Choose and review the ICO inventory before sending the transaction.
const icoAmount = ethers.parseEther("5000000");
await (await token.approve(addresses.ico, icoAmount)).wait();
```

Confirm the resulting balances and allowance before starting the sale. Keep the treasury signer separate from ordinary user accounts, and use a multisig for production treasury operations.

## Important notes

- The contracts are for development and review only; they have not been audited.
- Governance currently uses live balances; production governance should use snapshots, delegation, and timelocked execution.
- Use a multisig for treasury and privileged contract ownership.
- The token mints the fixed 21,000,000 VSC supply to the treasury and applies a configurable transfer burn.
- Staking must be funded before rewards can be claimed, and the ICO must have an approved VSC allowance before tokens can be sold.

See [`docs/architecture.md`](docs/architecture.md) for the system overview.
