# Vistacion Architecture Overview

Vistacion (VSC) is an ERC-20 token at the centre of a small ecosystem of smart contracts:

- **VistacionToken** — fixed-supply VSC currency with a configurable transfer burn.
- **Staking** — users lock VSC to earn rewards.
- **Escrow** — VSC-denominated trades for bullion/minerals, mediated by an oracle.
- **Governance** — token-weighted voting on protocol decisions.
- **ICO** — initial distribution of VSC to investors.

All contracts share the same token:

- Staking, Escrow, and ICO use `transfer` / `transferFrom` on `VistacionToken`.
- Governance uses `balanceOf` on `VistacionToken` for voting power.

Actors:

- **Users** — hold, stake, trade, vote, and buy.
- **Treasury** — receives ICO funds, holds reserves, and may own admin roles.
- **Oracle** — verifies off-chain trade documents for Escrow.
- **Validators / chain** — execute transactions and secure the network.

The deployment scripts write addresses to `deploy-addresses.json` and must be run in dependency order: token, staking, escrow, governance, then ICO.

This design keeps VSC as the single unit of value while separating concerns into focused contracts.
