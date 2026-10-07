# Vistacion Blockchain (VSC)

![Solidity](https://img.shields.io/badge/Solidity-0.8.x-blue.svg)
![Hardhat](https://img.shields.io/badge/Hardhat-ready-yellow.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

Vistacion (VSC) is a deflationary ERC-20 token with staking, escrow, governance, and ICO contracts, designed to evolve into a full commodity-backed, Proof-of-Stake ecosystem.

## Quick start

```bash
npm install
npm run compile
npm test
```

Copy `.env.example` to `.env` and configure the Sepolia RPC URL, deployer key, treasury address, and oracle address before deploying. On Windows PowerShell, run `Copy-Item .env.example .env`. Never commit `.env`, private keys, or funded wallet seed phrases.

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

Deploy the complete set again when changing contract code. Existing Sepolia addresses in the registry refer to already deployed bytecode and are not updated by compiling or changing local files.

## Post-deployment treasury setup

After all contracts are deployed, configure the optional amounts in `.env` if needed:

```dotenv
STAKING_FUND_AMOUNT=1000000
ICO_SALE_AMOUNT=5000000
```

Then run treasury funding with the signer whose address matches `TREASURY_ADDRESS`:

```bash
npm run post-deploy:treasury
```

The script will:

1. Refuse to run unless the Hardhat network is Sepolia.
2. Validate the deployment addresses and confirm that contract code exists at each address.
3. Require `TREASURY_ADDRESS` and verify that it matches the transaction signer.
4. Fund Staking's tracked reward reserve to at least `STAKING_FUND_AMOUNT`, accounting for the VSC transfer burn.
5. Transfer ICO inventory to reach `ICO_SALE_AMOUNT` tokens after the transfer burn.
6. Re-read and verify the final Staking reward reserve and ICO token balance.

The configured values are target net balances; the treasury must hold more to cover transfer burns. The script is idempotent for these targets and skips funding when the existing reserve or inventory is sufficient.

## Transfer-fee behavior

VSC applies its configured burn on transfers, including transfers into and out of ecosystem contracts. Staking and Escrow account for the amount they actually receive. Stakes, reward claims, and escrow payouts/refunds deliver the transferred amount less the burn. The ICO grosses up its transfer so buyers receive the quoted quantity; that burn is paid from ICO inventory. Check the resulting amounts before confirming any transaction.

## Important notes

- The contracts are for development and review only; they have not been audited.
- Governance currently uses live balances; production governance should use snapshots, delegation, and timelocked execution.
- Use a multisig for treasury and privileged contract ownership.
- The token mints the fixed 21,000,000 VSC supply to the treasury and applies a configurable transfer burn.
- Staking must have a funded reward reserve before rewards can be claimed, and the ICO must hold sale inventory before tokens can be sold.
- Deployments are not audited or production-certified. Review the contracts, deployment parameters, oracle trust model, and Sepolia smoke tests before any mainnet use.

See [`docs/architecture.md`](docs/architecture.md) for the system overview.
