# Vistacion dApp

A Next.js interface for the Vistacion Sepolia deployment. The current dashboard
supports injected-wallet connection (MetaMask, Rabby, or Coinbase Wallet),
read-only VSC and Sepolia ETH balances, VSC transfers, and ERC-20 approvals.
The Staking page displays the live APR, total staked, reward reserve, user
position, and pending rewards, and supports token approval, staking, reward
claims, and unstaking. The Escrow page supports deal creation, recent deal
listing, seller document-submission status, and oracle resolution.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Connect an injected wallet
and switch it to Sepolia (chain ID `11155111`) to read balances and submit
transactions. Confirm transaction details in your wallet before signing.

Staking amounts use 18 token decimals. Because VSC applies a 0.5% transfer burn,
the staked position is credited with the net amount received; outgoing unstake
and reward transfers are also burn-adjusted. The interface previews those
amounts and prevents reward claims when the observed reserve is below the
pending reward amount.

Escrow deposits are recorded at the net amount received by the contract, and
the eventual release/refund transfer is subject to the token burn. The contract
only stores a document-submission flag; it does not upload, hash, or retain
documents. Resolution is restricted to the configured oracle.

## Deployment configuration

The frontend uses the deployed Sepolia addresses in `src/config/contracts.ts`.
Wallet reads and writes are sent through the connected wallet provider; this app
does not require an RPC API key. The interface is testnet-only and does not
provide WalletConnect support.

Governance and Presale remain roadmap placeholders and are not active integrations yet.
