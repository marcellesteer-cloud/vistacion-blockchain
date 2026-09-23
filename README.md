# Vistacion Blockchain

Starter Hardhat project for the Vistacion (VSC) ERC-20 ecosystem.

## Quick start

```bash
npm install
cp .env.example .env
npx hardhat compile
npx hardhat test
```

Deploy to Sepolia after configuring `.env`:

```bash
npm run deploy:token
```

The token mints the fixed 21,000,000 VSC supply to the treasury and applies a configurable transfer burn. The starter contracts are for development and review only; they have not been audited and must not be used in production without security review.

## Important setup notes

- Never commit `.env`, private keys, or funded wallet seed phrases.
- `Staking` must be funded with VSC before rewards can be claimed.
- `ICO` must receive a VSC allowance/transfer from the treasury before sales begin.
- Governance currently uses live balances; production governance should use snapshots/delegation and timelocked execution.
- Use a multisig for treasury and privileged contract ownership.
