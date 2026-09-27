# Vistacion (VSC) Blockchain Deployment Guide

This guide walks you through deploying the complete Vistacion ecosystem to Sepolia testnet.

## Prerequisites

### Required
- **Node.js** (v16+) and npm
- **Sepolia testnet ETH** (for gas fees)
- **Infura API Key** or similar RPC provider

### Recommended
- A dedicated deployment account (don't use main wallets)
- Multi-signature wallet for treasury in production
- Backup of all private keys

## Step 1: Setup

### Clone and Install
```bash
git clone https://github.com/marcellesteer-cloud/vistacion-blockchain.git
cd vistacion-blockchain
npm install
```

### Configure Environment

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```dotenv
# RPC endpoint (Infura, Alchemy, etc.)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Private key of deployment wallet (has Sepolia ETH for gas)
DEPLOYER_PRIVATE_KEY=0xyour_private_key_here

# Address that will receive minted VSC tokens
TREASURY_ADDRESS=0xyour_treasury_address

# Oracle address for Escrow contract (can be any address initially)
ORACLE_ADDRESS=0xyour_oracle_address

# Optional: Customize funding amounts (default shown)
STAKING_FUND_AMOUNT=1000000      # VSC tokens for staking rewards
ICO_SALE_AMOUNT=5000000           # VSC tokens for ICO sale
```

**⚠️ CRITICAL: Never commit `.env` or share private keys**

### Verify Compilation

```bash
npm run compile
```

You should see:
```
Compiled 5 Solidity files successfully
```

## Step 2: Deploy Contracts in Order

Deploy contracts in **exact order** (dependencies are strict):

### 1. Deploy Token
```bash
npm run deploy:token
```

**Output example:**
```
Deploying token with: 0x1234...
VistacionToken deployed to: 0xabcd...
```

Saves address to `deploy-addresses.json`.

### 2. Deploy Staking
```bash
npm run deploy:staking
```

Requires token address from step 1. Sets up 5% APR reward pool.

### 3. Deploy Escrow
```bash
npm run deploy:escrow
```

Sets up commodity trade escrow mediated by oracle.

### 4. Deploy Governance
```bash
npm run deploy:governance
```

Enables token-weighted voting on protocol decisions.

### 5. Deploy ICO
```bash
npm run deploy:ico
```

Initializes token sale (tokens/wei price, start/end time).

### Verify All Addresses

Check `deploy-addresses.json`:
```bash
cat deploy-addresses.json
```

Output example:
```json
{
  "network": "sepolia",
  "token": "0xabcd...",
  "staking": "0xdef0...",
  "escrow": "0x1234...",
  "governance": "0x5678...",
  "ico": "0x9abc..."
}
```

## Step 3: Post-Deployment Treasury Setup

After all contracts are deployed, fund the staking rewards pool and authorize the ICO:

```bash
npm run post-deploy:treasury
```

This script will:

1. ✅ Verify all contracts exist on Sepolia
2. ✅ Transfer VSC to Staking (accounts for 0.5% burn fee)
3. ✅ Approve ICO contract to spend VSC
4. ✅ Display final balances

**Output example:**
```
Treasury: 0x1234...
Checking contract code at all addresses...
Staking funded with 1000000 VSC
ICO approved for 5000000 VSC
Final Staking balance: 995000 VSC
Final ICO allowance: 5000000 VSC
Setup complete!
```

## Step 4: Verify on Etherscan

Visit [Sepolia Etherscan](https://sepolia.etherscan.io/) and search each address from `deploy-addresses.json`:

- ✅ Code should be present
- ✅ Constructor arguments should match
- ✅ Verify source code for transparency

**Contract Verification (Optional but Recommended):**

Flatten contracts and upload to Etherscan for public verification:
```bash
npx hardhat flatten contracts/VistacionToken.sol > flattened-token.sol
# Then upload via Etherscan's verification interface
```

## Deployment Checklist

Before deploying to mainnet, verify:

- [ ] All 5 contracts deployed successfully
- [ ] All addresses recorded in `deploy-addresses.json`
- [ ] Treasury balance confirmed on Sepolia
- [ ] Staking pool funded (1M+ VSC)
- [ ] ICO allowance approved (5M+ VSC)
- [ ] Oracle address set correctly in Escrow
- [ ] Tested staking: stake, accrue, claim rewards
- [ ] Tested ICO: buy tokens (send ETH, receive VSC)
- [ ] Tested governance: create proposal, vote, execute
- [ ] Reviewed all contract parameters in docs/architecture.md

## Troubleshooting

### "Token address is missing"
**Solution:** Run `deploy:token` first; it must be deployed before other contracts.

### "Insufficient balance for gas"
**Solution:** The deployer wallet needs more Sepolia ETH. Request from [Sepolia faucet](https://sepoliafaucet.com/).

### "SEPOLIA_RPC_URL is required"
**Solution:** Check `.env` has `SEPOLIA_RPC_URL` set to a valid endpoint.

### Staking rewards not accruing
**Solution:** Staking contract must have a balance. Run `post-deploy:treasury` to fund it.

### ICO buy() reverts
**Solution:** ICO needs approved VSC allowance. Run `post-deploy:treasury` to authorize it.

## Contract Architecture

```
VistacionToken (21M fixed supply, 0.5% burn per transfer)
    ↓
    ├─→ Staking (lock VSC, earn 5% APR)
    ├─→ Escrow (trade VSC for commodities)
    ├─→ Governance (token-weighted voting)
    └─→ ICO (buy VSC with ETH)
```

## Production Considerations

**Before mainnet deployment:**

1. **Security:**
   - [ ] Contracts audited by professional firm
   - [ ] Private keys in hardware wallet or multisig
   - [ ] Treasury is multisig (2-of-3 or better)

2. **Governance:**
   - [ ] Use vote delegation and snapshots (not live balances)
   - [ ] Implement timelock for proposal execution
   - [ ] Document voting thresholds

3. **Parameters:**
   - [ ] Review staking APR (currently 5%)
   - [ ] Set realistic ICO price (currently example values)
   - [ ] Confirm burn rate (currently 0.5%)
   - [ ] Set oracle address to trusted third party

4. **Monitoring:**
   - [ ] Track contract balance changes
   - [ ] Alert on large transfers
   - [ ] Monitor governance proposals

## Support & Resources

- **Architecture:** See `docs/architecture.md`
- **Contracts:** See `contracts/` directory
- **Tests:** `npm run test` (run unit tests)
- **Sepolia Explorer:** https://sepolia.etherscan.io/

## License

MIT License — See LICENSE file.
