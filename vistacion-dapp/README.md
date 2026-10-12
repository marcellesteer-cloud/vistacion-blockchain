# Vistacoin dApp

A Next.js interface for the Vistacoin Sepolia deployment. The current dashboard
supports injected-wallet connection (MetaMask, Rabby, or Coinbase Wallet),
read-only VSC and Sepolia ETH balances, VSC transfers, and ERC-20 approvals.
The Staking page displays the live APR, total staked, reward reserve, user
position, and pending rewards, and supports token approval, staking, reward
claims, and unstaking. The Escrow page supports deal creation, recent deal
listing, seller document-submission status, and oracle resolution. Governance
supports proposals, token-weighted voting, and result execution. The Presale
page displays live sale terms and inventory and supports VSC purchases.

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

Governance uses current VSC balances when users vote, permits one vote per
wallet per proposal, and has no quorum or historical balance snapshot.
Executing a passed proposal only marks it executed; it does not invoke other
contracts or move funds. The deployed contract has no proposal-count getter, so
the interface scans indexed proposal records up to its supported display cap.

The sale quote follows the deployed ICO formula and displays the buyer amount,
estimated inventory debit, and burn. ETH raised is not displayed because the
deployed sale contract has no cumulative proceeds field or purchase event.

## Deployment configuration

The frontend uses the deployed Sepolia addresses in `src/config/contracts.ts`.
Public contract data is read from the Sepolia public RPC; account-specific
balances and every transaction use the connected wallet provider. This app
does not require an RPC API key. The interface is testnet-only and does not
provide WalletConnect support.

## Publish on Vercel

1. Push this repository to a Git provider that your Vercel account can access.
2. In Vercel, import the repository and set **Root Directory** to
   `vistacion-dapp`.
3. Keep the detected Next.js framework and default install/build commands
   (`npm install` and `npm run build`).
4. Deploy. No wallet private keys, API keys, or other secrets are needed.
5. After the deployment, use the public `*.vercel.app` URL or attach a domain
   you control in Vercel's project settings.
6. If using a custom domain, set `NEXT_PUBLIC_SITE_URL` in Vercel's production
   environment to that full HTTPS origin (for example,
   `https://app.example.com`) and redeploy.
7. Check `/robots.txt` and `/sitemap.xml` on the production URL, then submit
   the sitemap in Google Search Console and Bing Webmaster Tools.

Search indexing is not immediate or guaranteed. Preview deployments and local
development are configured not to be indexed. The published app still targets
Sepolia test contracts and must not be presented as a real-money service.
