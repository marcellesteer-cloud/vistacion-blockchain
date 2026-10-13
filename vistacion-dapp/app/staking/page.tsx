"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BrowserProvider,
  Contract,
  formatUnits,
  parseUnits,
  type TransactionResponse,
} from "ethers";
import { STAKING_ABI, TOKEN_ABI } from "@/src/config/abi";
import { CONTRACTS } from "@/src/config/contracts";
import { NETWORKS, SEPOLIA_CHAIN_ID } from "@/src/config/networks";
import {
  getInjectedWallets,
  type InjectedWallet,
} from "@/src/lib/injected-wallet";
import { getSepoliaReadProvider } from "@/src/lib/sepolia-read-provider";

interface StakingData {
  aprBps: bigint;
  totalStaked: bigint;
  rewardPool: bigint;
  position: bigint;
  pendingRewards: bigint;
  tokenBalance: bigint;
  allowance: bigint;
  burnBasisPoints: bigint;
}

interface TransactionState {
  label: string;
  hash?: string;
  complete: boolean;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "The wallet request failed. Check your wallet and try again.";
}

function formatTokenAmount(value: bigint): string {
  return Number(formatUnits(value, 18)).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

function formatInputAmount(value: string, burnBasisPoints: bigint): string {
  if (!value || !/^\d+(\.\d+)?$/.test(value)) return "";
  try {
    const grossAmount = parseUnits(value, 18);
    const receivedAmount =
      grossAmount - (grossAmount * burnBasisPoints) / BigInt(10_000);
    return formatTokenAmount(receivedAmount);
  } catch {
    return "";
  }
}

function amountExceedsLimit(value: string, limit: bigint): boolean {
  if (!value) return false;
  try {
    return parseUnits(value, 18) > limit;
  } catch {
    return true;
  }
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getInjectedChainId(value: unknown): number | null {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) return null;
  return Number.parseInt(value, 16);
}

export default function StakingPage() {
  const [wallets, setWallets] = useState<InjectedWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState(0);
  const [activeWallet, setActiveWallet] = useState<InjectedWallet | null>(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [data, setData] = useState<StakingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [transaction, setTransaction] = useState<TransactionState | null>(null);
  const [approvalAmount, setApprovalAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  const isSepolia = !activeWallet || chainId === SEPOLIA_CHAIN_ID;
  const selectedWalletOption = wallets[selectedWallet];
  const explorer = "https://sepolia.etherscan.io";

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const provider = activeWallet
        ? new BrowserProvider(activeWallet.provider, "any")
        : getSepoliaReadProvider();
      const network = await provider.getNetwork();
      const activeChainId = Number(network.chainId);
      setChainId(activeChainId);
      if (activeChainId !== SEPOLIA_CHAIN_ID) {
        setData(null);
        return;
      }

      const token = new Contract(CONTRACTS.token, TOKEN_ABI, provider);
      const staking = new Contract(CONTRACTS.staking, STAKING_ABI, provider);
      const [
        aprBps,
        totalStaked,
        rewardPool,
        position,
        pendingRewards,
        tokenBalance,
        allowance,
        burnBasisPoints,
      ] = await Promise.all([
        staking.aprBps() as Promise<bigint>,
        staking.totalStaked() as Promise<bigint>,
        staking.rewardPool() as Promise<bigint>,
        account
          ? staking.positions(account) as Promise<readonly [bigint, bigint, bigint]>
          : Promise.resolve([BigInt(0), BigInt(0), BigInt(0)] as const),
        account ? staking.pendingRewards(account) as Promise<bigint> : Promise.resolve(BigInt(0)),
        account ? token.balanceOf(account) as Promise<bigint> : Promise.resolve(BigInt(0)),
        account ? token.allowance(account, CONTRACTS.staking) as Promise<bigint> : Promise.resolve(BigInt(0)),
        token.burnBasisPoints() as Promise<bigint>,
      ]);

      setData({
        aprBps,
        totalStaked,
        rewardPool,
        position: position[0],
        pendingRewards,
        tokenBalance,
        allowance,
        burnBasisPoints,
      });
    } catch (refreshError) {
      setError(errorMessage(refreshError));
    } finally {
      setLoading(false);
    }
  }, [account, activeWallet]);

  useEffect(() => {
    if (!activeWallet) return;

    const onAccountsChanged = (value: unknown) => {
      const accounts = Array.isArray(value) ? value : [];
      const nextAccount = typeof accounts[0] === "string" ? accounts[0] : "";
      setAccount(nextAccount);
      setData(null);
      setError("");
    };
    const onChainChanged = (value: unknown) => {
      setChainId(getInjectedChainId(value));
      setData(null);
      window.setTimeout(() => void refresh(), 0);
    };

    activeWallet.provider.on?.("accountsChanged", onAccountsChanged);
    activeWallet.provider.on?.("chainChanged", onChainChanged);
    return () => {
      activeWallet.provider.removeListener?.("accountsChanged", onAccountsChanged);
      activeWallet.provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [activeWallet, refresh]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => void refresh(), 20_000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [account, activeWallet, refresh]);

  async function connectWallet() {
    setError("");
    const available = getInjectedWallets();
    setWallets(available);
    if (available.length > 1 && wallets.length === 0) {
      setError("Choose a wallet provider, then connect.");
      return;
    }
    const wallet = available[selectedWallet] ?? available[0];
    if (!wallet) {
      setError("No injected wallet found. Install MetaMask, Rabby, or Coinbase Wallet.");
      return;
    }

    try {
      const accounts = await wallet.provider.request({ method: "eth_requestAccounts" });
      if (!Array.isArray(accounts) || typeof accounts[0] !== "string") {
        throw new Error("The wallet did not return an account.");
      }
      const chain = await wallet.provider.request({ method: "eth_chainId" });
      setActiveWallet(wallet);
      setAccount(accounts[0]);
      setChainId(getInjectedChainId(chain));
      setData(null);
      setTransaction(null);
    } catch (connectError) {
      setError(errorMessage(connectError));
    }
  }

  function disconnectWallet() {
    setActiveWallet(null);
    setAccount("");
    setChainId(null);
    setData(null);
    setTransaction(null);
    setError("");
  }

  async function switchToSepolia() {
    if (!activeWallet) return;
    setError("");
    try {
      await activeWallet.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORKS.sepolia.chainId }],
      });
      setChainId(SEPOLIA_CHAIN_ID);
      await refresh();
    } catch (switchError) {
      const code =
        typeof switchError === "object" && switchError !== null && "code" in switchError
          ? switchError.code
          : undefined;
      if (code === 4902) {
        try {
          await activeWallet.provider.request({
            method: "wallet_addEthereumChain",
            params: [NETWORKS.sepolia],
          });
          setChainId(SEPOLIA_CHAIN_ID);
          await refresh();
          return;
        } catch (addError) {
          setError(errorMessage(addError));
          return;
        }
      }
      setError(errorMessage(switchError));
    }
  }

  async function sendTransaction(
    label: string,
    submit: () => Promise<TransactionResponse>,
  ) {
    if (!activeWallet || !account || !isSepolia) {
      setError("Connect a wallet on Sepolia before submitting a transaction.");
      return;
    }

    setWorking(true);
    setError("");
    setTransaction({ label, complete: false });
    try {
      const response = await submit();
      setTransaction({ label, hash: response.hash, complete: false });
      const receipt = await response.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error("The transaction was not confirmed successfully.");
      }
      setTransaction({ label, hash: response.hash, complete: true });
      await refresh();
    } catch (transactionError) {
      setError(errorMessage(transactionError));
      setTransaction(null);
    } finally {
      setWorking(false);
    }
  }

  async function approveStaking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeWallet) {
      setError("Connect a wallet before approving tokens.");
      return;
    }

    try {
      const amount = parseUnits(approvalAmount, 18);
      if (amount <= BigInt(0)) throw new Error("Enter an allowance greater than zero.");
      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const token = new Contract(CONTRACTS.token, TOKEN_ABI, signer);
      await sendTransaction("Staking approval", () =>
        token.approve(CONTRACTS.staking, amount),
      );
    } catch (approvalError) {
      setError(errorMessage(approvalError));
    }
  }

  async function stakeTokens(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeWallet) {
      setError("Connect a wallet before staking.");
      return;
    }

    try {
      const amount = parseUnits(stakeAmount, 18);
      if (amount <= BigInt(0)) throw new Error("Enter an amount greater than zero.");
      if (data && amount > data.tokenBalance) {
        throw new Error("Stake amount exceeds your VSC wallet balance.");
      }
      if (data && amount > data.allowance) {
        throw new Error("Approve this staking contract for the entered amount first.");
      }
      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const staking = new Contract(CONTRACTS.staking, STAKING_ABI, signer);
      await sendTransaction("Stake VSC", () => staking.stake(amount));
    } catch (stakeError) {
      setError(errorMessage(stakeError));
    }
  }

  async function unstakeTokens(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeWallet) {
      setError("Connect a wallet before unstaking.");
      return;
    }

    try {
      const amount = parseUnits(unstakeAmount, 18);
      if (amount <= BigInt(0)) throw new Error("Enter an amount greater than zero.");
      if (data && amount > data.position) {
        throw new Error("Unstake amount exceeds your current staked balance.");
      }
      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const staking = new Contract(CONTRACTS.staking, STAKING_ABI, signer);
      await sendTransaction("Unstake VSC", () => staking.unstake(amount));
    } catch (unstakeError) {
      setError(errorMessage(unstakeError));
    }
  }

  async function claimRewards() {
    if (!activeWallet) {
      setError("Connect a wallet before claiming rewards.");
      return;
    }
    if (!data || data.pendingRewards <= BigInt(0)) {
      setError("There are no accrued rewards available to claim.");
      return;
    }
    if (data.pendingRewards > data.rewardPool) {
      setError("The reward reserve is currently below your accrued rewards.");
      return;
    }

    try {
      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const staking = new Contract(CONTRACTS.staking, STAKING_ABI, signer);
      await sendTransaction("Claim staking rewards", () => staking.claim());
    } catch (claimError) {
      setError(errorMessage(claimError));
    }
  }

  const apr = data ? (Number(data.aprBps) / 100).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  }) : "—";
  const pendingNet =
    data && data.pendingRewards > BigInt(0)
      ? formatTokenAmount(
          data.pendingRewards -
            (data.pendingRewards * data.burnBasisPoints) / BigInt(10_000),
        )
      : "0";

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Vistacoin home">
          <span className="brand-mark">V</span>
          <span>VISTACOIN</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link className="nav-link" href="/dashboard">Dashboard</Link>
          <Link className="nav-link active" href="/staking">Staking</Link>
          <Link className="nav-link" href="/escrow">Escrow</Link>
          <Link className="nav-link" href="/governance">Governance</Link>
          <Link className="nav-link" href="/ico">Presale</Link>
        </nav>
        <a className="aerovista-button" href="https://fly-aerovista.emergent.host" target="_blank" rel="noopener noreferrer">AeroVista Club <span aria-hidden="true">↗</span></a>
        <div className="wallet-controls">
          {activeWallet && account ? (
            <>
              <span className={`network-pill ${isSepolia ? "connected" : "warning"}`}>
                <span className="status-dot" />
                {isSepolia ? "Sepolia" : `Chain ${chainId ?? "unknown"}`}
              </span>
              <button className="wallet-button connected-wallet" onClick={disconnectWallet}>
                {shortenAddress(account)}
                <span className="wallet-action">Disconnect</span>
              </button>
            </>
          ) : (
            <div className="connect-row">
              {wallets.length > 1 && (
                <select
                  aria-label="Choose wallet"
                  value={selectedWallet}
                  onChange={(event) => setSelectedWallet(Number(event.target.value))}
                  className="wallet-select"
                >
                  {wallets.map((wallet, index) => (
                    <option key={`${wallet.name}-${index}`} value={index}>
                      {wallet.name}
                    </option>
                  ))}
                </select>
              )}
              <button className="wallet-button" onClick={connectWallet}>
                {selectedWalletOption ? `Connect ${selectedWalletOption.name}` : "Connect wallet"}
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="hero staking-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> VSC STAKING · SEPOLIA</p>
          <h1>Put your VSC<br /><span>to work.</span></h1>
          <p className="hero-description">
            Stake VSC to earn rewards. Your position reflects the net tokens received after transfer burn.
          </p>
          <div className="hero-actions">
            {activeWallet && !isSepolia ? (
              <button className="primary-button" onClick={switchToSepolia}>
                Switch to Sepolia
              </button>
            ) : !activeWallet ? (
              <button className="primary-button" onClick={connectWallet}>
                Connect wallet <span aria-hidden="true">↗</span>
              </button>
            ) : (
              <button
                className="primary-button secondary-action"
                onClick={() => void refresh()}
                disabled={loading}
              >
                {loading ? "Refreshing…" : "Refresh staking data"}
              </button>
            )}
            <a
              className="text-link"
              href={`${explorer}/address/${CONTRACTS.staking}`}
              target="_blank"
              rel="noreferrer"
            >
              View staking contract <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className="staking-hero-stat">
          <span className="staking-hero-label">CURRENT APR</span>
          <strong>{apr}<span>%</span></strong>
          <span className="staking-hero-foot">Rewards accrue continuously</span>
        </div>
      </section>

      {error && (
        <div className="notice error-notice" role="alert">
          <span className="notice-icon">!</span>
          <span>{error}</span>
          <button className="notice-close" onClick={() => setError("")} aria-label="Dismiss error">×</button>
        </div>
      )}

      {transaction && (
        <div className={`notice transaction-notice ${transaction.complete ? "success-notice" : ""}`} role="status">
          <span className="notice-icon">{transaction.complete ? "✓" : "…"}</span>
          <span>
            {transaction.complete ? `${transaction.label} confirmed` : `${transaction.label} submitted`}
            {transaction.hash && (
              <>
                {" · "}
                <a href={`${explorer}/tx/${transaction.hash}`} target="_blank" rel="noreferrer">
                  View transaction
                </a>
              </>
            )}
          </span>
          <button className="notice-close" onClick={() => setTransaction(null)} aria-label="Dismiss transaction status">×</button>
        </div>
      )}

      <section className="metric-grid staking-metrics" aria-label="Staking overview">
        <article className="metric-card balance-card">
          <div className="metric-head">
            <span className="metric-label">YOUR STAKED BALANCE</span>
            <span className="metric-icon">V</span>
          </div>
          <div className="metric-value">
            {data && account ? formatTokenAmount(data.position) : "—"} <span>VSC</span>
          </div>
          <div className="metric-foot">
            {account ? shortenAddress(account) : "Connect wallet to view your position"}
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-head">
            <span className="metric-label">TOTAL STAKED</span>
            <span className="metric-icon">↗</span>
          </div>
          <div className="metric-value">
            {data ? formatTokenAmount(data.totalStaked) : "—"} <span>VSC</span>
          </div>
          <div className="metric-foot">Net VSC held for staking</div>
        </article>
        <article className="metric-card">
          <div className="metric-head">
            <span className="metric-label">REWARD RESERVE</span>
            <span className="metric-icon burn-icon">✳</span>
          </div>
          <div className="metric-value">
            {data ? formatTokenAmount(data.rewardPool) : "—"} <span>VSC</span>
          </div>
          <div className="metric-foot">Remaining reward inventory</div>
        </article>
      </section>

      <section className="dashboard-grid staking-dashboard">
        <article className="panel staking-position-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR POSITION</p>
              <h2>Staking rewards</h2>
            </div>
            <span className="panel-symbol">{apr}% APR</span>
          </div>
          {!activeWallet || !account ? (
            <div className="wallet-prompt">
              <div className="prompt-icon">⌁</div>
              <h3>Connect your wallet</h3>
              <p>Connect an injected wallet to see your staking position and rewards.</p>
              <button className="primary-button" onClick={connectWallet}>Connect wallet</button>
              <span className="wallet-support">MetaMask · Rabby · Coinbase Wallet</span>
            </div>
          ) : !isSepolia ? (
            <div className="wallet-prompt">
              <div className="prompt-icon warning-prompt">!</div>
              <h3>Wrong network</h3>
              <p>Switch your wallet to Sepolia to read your position and stake VSC.</p>
              <button className="primary-button" onClick={switchToSepolia}>Switch to Sepolia</button>
            </div>
          ) : (
            <>
              <div className="staking-reward-highlight">
                <div>
                  <span className="metric-label">ACCRUED REWARDS</span>
                  <strong>                  {data && account ? formatTokenAmount(data.pendingRewards) : "—"} <span>VSC</span></strong>
                  <small>
                    {data ? `≈ ${pendingNet} VSC received after ${Number(data.burnBasisPoints) / 100}% burn` : "Loading live staking position"}
                  </small>
                </div>
                <button
                  className="primary-button"
                  onClick={() => void claimRewards()}
                  disabled={
                    working ||
                    !activeWallet ||
                    !account ||
                    !data ||
                    data.pendingRewards <= BigInt(0) ||
                    data.pendingRewards > data.rewardPool
                  }
                >
                  {working ? "Waiting…" : "Claim rewards"}
                </button>
              </div>
              {data && data.pendingRewards > data.rewardPool && (
                <p className="reserve-warning" role="status">
                  The reward reserve is below your accrued entitlement. Claims are unavailable until more rewards are funded.
                </p>
              )}
              <div className="detail-list staking-position-details">
                <div className="detail-row">
                  <span>Wallet VSC balance</span>
                  <strong>{data && account ? `${formatTokenAmount(data.tokenBalance)} VSC` : "Connect wallet"}</strong>
                </div>
                <div className="detail-row">
                  <span>Approved allowance</span>
                  <strong>{data && account ? `${formatTokenAmount(data.allowance)} VSC` : "Connect wallet"}</strong>
                </div>
                <div className="detail-row">
                  <span>Staking contract</span>
                  <a href={`${explorer}/address/${CONTRACTS.staking}`} target="_blank" rel="noreferrer">
                    {shortenAddress(CONTRACTS.staking)} <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
              <div className="release-note staking-accounting-note">
                <span className="release-check">i</span>
                <span>
                  Deposits credit <strong>net tokens</strong>; unstake and reward transfers also incur burn.
                </span>
              </div>
            </>
          )}
        </article>

        <article className="panel staking-actions-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ON-CHAIN CONTROLS</p>
              <h2>Manage your stake</h2>
            </div>
            <span className="secure-label"><span className="secure-dot" /> SELF-CUSTODY</span>
          </div>
          {!activeWallet || !account || !isSepolia ? (
            <div className="wallet-prompt staking-action-prompt">
              <div className={`prompt-icon ${activeWallet ? "warning-prompt" : ""}`}>
                {activeWallet ? "!" : "⌁"}
              </div>
              <h3>{activeWallet ? "Sepolia required" : "Wallet required"}</h3>
              <p>
                {activeWallet && account
                  ? "Switch to Sepolia to approve, stake, or withdraw tokens."
                  : "Connect an injected wallet to manage your VSC stake."}
              </p>
              {activeWallet && account ? (
                <button className="primary-button" onClick={switchToSepolia}>Switch to Sepolia</button>
              ) : (
                <button className="primary-button" onClick={connectWallet}>Connect wallet</button>
              )}
            </div>
          ) : (
            <div className="forms-stack staking-forms">
              <form className="action-form" onSubmit={approveStaking}>
                <div className="form-title">
                  <span className="form-icon approval-icon">◎</span>
                  <div><h3>Approve VSC</h3><p>Allow the staking contract to transfer VSC.</p></div>
                </div>
                <label htmlFor="staking-approval-amount">Allowance amount</label>
                <div className="amount-input">
                  <input
                    id="staking-approval-amount"
                    value={approvalAmount}
                    onChange={(event) => setApprovalAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    required
                  />
                  <span>VSC</span>
                </div>
                <p className="form-hint">Approve only the amount you intend to stake.</p>
                <button className="submit-button outline-button" type="submit" disabled={working || !approvalAmount}>
                  {working ? "Waiting for wallet…" : "Approve staking"} <span aria-hidden="true">→</span>
                </button>
              </form>

              <form className="action-form" onSubmit={stakeTokens}>
                <div className="form-title">
                  <span className="form-icon">↗</span>
                  <div><h3>Stake VSC</h3><p>Earn rewards at the current APR.</p></div>
                </div>
                <label htmlFor="staking-stake-amount">Amount to stake</label>
                <div className="amount-input">
                  <input
                    id="staking-stake-amount"
                    value={stakeAmount}
                    onChange={(event) => setStakeAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    required
                  />
                  <span>VSC</span>
                </div>
                <p className="form-hint">
                  {data && stakeAmount
                    ? `Estimated credited stake: ${formatInputAmount(stakeAmount, data.burnBasisPoints)} VSC`
                    : "Stake amount is reduced by the transfer burn."}
                </p>
                <button
                  className="submit-button"
                  type="submit"
                  disabled={
                    working ||
                    !stakeAmount ||
                    !data ||
                    amountExceedsLimit(stakeAmount, data.allowance) ||
                    amountExceedsLimit(stakeAmount, data.tokenBalance)
                  }
                >
                  {working ? "Waiting for wallet…" : "Stake tokens"} <span aria-hidden="true">→</span>
                </button>
                {data && amountExceedsLimit(stakeAmount, data.allowance) && (
                  <p className="inline-warning">Approve the staking contract for at least this amount.</p>
                )}
                {data && amountExceedsLimit(stakeAmount, data.tokenBalance) && (
                  <p className="inline-warning">Amount exceeds your VSC wallet balance.</p>
                )}
              </form>

              <form className="action-form" onSubmit={unstakeTokens}>
                <div className="form-title">
                  <span className="form-icon unstake-icon">↙</span>
                  <div><h3>Unstake VSC</h3><p>Withdraw all or part of your position.</p></div>
                </div>
                <label htmlFor="staking-unstake-amount">Amount to withdraw</label>
                <div className="amount-input">
                  <input
                    id="staking-unstake-amount"
                    value={unstakeAmount}
                    onChange={(event) => setUnstakeAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    required
                  />
                  <span>VSC</span>
                </div>
                <p className="form-hint">
                  {data && unstakeAmount
                    ? `Estimated wallet receipt: ${formatInputAmount(unstakeAmount, data.burnBasisPoints)} VSC`
                    : `Available to withdraw: ${data ? formatTokenAmount(data.position) : "—"} VSC`}
                </p>
                <button
                  className="submit-button"
                  type="submit"
                  disabled={
                    working ||
                    !unstakeAmount ||
                    !data ||
                    amountExceedsLimit(unstakeAmount, data.position)
                  }
                >
                  {working ? "Waiting for wallet…" : "Unstake tokens"} <span aria-hidden="true">→</span>
                </button>
                {data && amountExceedsLimit(unstakeAmount, data.position) && (
                  <p className="inline-warning">Amount exceeds your staked balance.</p>
                )}
              </form>
            </div>
          )}
        </article>
      </section>

      <footer className="site-footer">
        <span>VISTACOIN <span className="footer-muted">· SEPOLIA TESTNET</span></span>
        <span>Testnet interface · Verify every transaction in your wallet</span>
        <a href={`${explorer}/address/${CONTRACTS.staking}`} target="_blank" rel="noreferrer">
          Etherscan ↗
        </a>
      </footer>
    </main>
  );
}
