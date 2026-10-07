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

## Deployment and treasury operations

The deployment scripts write addresses to `deploy-addresses.json` and must be run in dependency order: token, staking, escrow, governance, then ICO.

After deployment, the treasury must complete both funding operations before testing the staking and ICO flows:

1. Approve **Staking** to pull the reward funding and call `fundRewards`. The contract records the amount actually received after the token burn as its reward reserve.
2. Transfer VSC inventory directly to **ICO**. The sale requires a token balance; an allowance by itself does not fund it.

`STAKING_FUND_AMOUNT` and `ICO_SALE_AMOUNT` are target balances after token transfer burn. The setup script grosses up the transfers and verifies the final reward reserve and sale inventory. The address registry contains deployment outputs, not funding status.

## Transfer-fee accounting

VSC burns the configured fee on transfers. Staking positions and Escrow deals record the amount received by the contract, rather than the requested transfer amount. Staking withdrawals/rewards and escrow releases/refunds deliver the transferred amount less the burn. The ICO grosses up the outgoing transfer so the buyer receives the quoted quantity; the burn is charged against its sale inventory.

Redeploy contracts after changing their source: existing on-chain addresses continue running their originally deployed bytecode.

This design keeps VSC as the single unit of value while separating concerns into focused contracts.
