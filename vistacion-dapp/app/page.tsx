"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BrowserProvider,
  Contract,
  formatEther,
  formatUnits,
  isAddress,
  parseUnits,
  type TransactionResponse,
} from "ethers";
import { TOKEN_ABI } from "@/src/config/abi";
import { CONTRACTS, DEPLOYED_SOURCE } from "@/src/config/contracts";
import { NETWORKS, SEPOLIA_CHAIN_ID } from "@/src/config/networks";
import {
  getInjectedWallets,
  type InjectedWallet,
} from "@/src/lib/injected-wallet";
import { getSepoliaReadProvider } from "@/src/lib/sepolia-read-provider";

interface TokenData {
  name: string;
  symbol: string;
  totalSupply: bigint;
  balance: bigint;
  burnBasisPoints: bigint;
  nativeBalance: bigint;
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

function formatEth(value: bigint): string {
  return Number(formatEther(value)).toLocaleString(undefined, {
    maximumFractionDigits: 5,
  });
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getInjectedChainId(value: unknown): number | null {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) return null;
  return Number.parseInt(value, 16);
}

export default function Home() {
  const [wallets, setWallets] = useState<InjectedWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState(0);
  const [activeWallet, setActiveWallet] = useState<InjectedWallet | null>(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [transaction, setTransaction] = useState<TransactionState | null>(null);
  const [recipient, setRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [spender, setSpender] = useState("");
  const [approvalAmount, setApprovalAmount] = useState("");

  const isSepolia = !activeWallet || chainId === SEPOLIA_CHAIN_ID;
  const connectedWallet = wallets[selectedWallet];
  let transferPreview = "";
  if (transferAmount && /^\d+(\.\d+)?$/.test(transferAmount)) {
    try {
      const amount = parseUnits(transferAmount, 18);
      const bps = tokenData?.burnBasisPoints ?? BigInt(50);
      transferPreview = formatTokenAmount(
        amount - (amount * bps) / BigInt(10_000),
      );
    } catch {
      transferPreview = "";
    }
  }

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
        setTokenData(null);
        return;
      }

      const token = new Contract(CONTRACTS.token, TOKEN_ABI, provider);
      const [name, symbol, totalSupply, balance, burnBasisPoints, nativeBalance] =
        await Promise.all([
          token.name() as Promise<string>,
          token.symbol() as Promise<string>,
          token.totalSupply() as Promise<bigint>,
          account ? token.balanceOf(account) as Promise<bigint> : Promise.resolve(BigInt(0)),
          token.burnBasisPoints() as Promise<bigint>,
          account ? provider.getBalance(account) : Promise.resolve(BigInt(0)),
        ]);

      setTokenData({
        name,
        symbol,
        totalSupply,
        balance,
        burnBasisPoints,
        nativeBalance,
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
      setTokenData(null);
      setError("");
    };
    const onChainChanged = (value: unknown) => {
      setChainId(getInjectedChainId(value));
      setTokenData(null);
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
      setTokenData(null);
      setTransaction(null);
    } catch (connectError) {
      setError(errorMessage(connectError));
    }
  }

  function disconnectWallet() {
    setActiveWallet(null);
    setAccount("");
    setChainId(null);
    setTokenData(null);
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
    } catch (txError) {
      setError(errorMessage(txError));
      setTransaction(null);
    } finally {
      setWorking(false);
    }
  }

  async function transferTokens(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAddress(recipient)) {
      setError("Enter a valid recipient wallet address.");
      return;
    }
    if (!activeWallet) {
      setError("Connect a wallet before submitting a transaction.");
      return;
    }
    try {
      const amount = parseUnits(transferAmount, 18);
      if (amount <= BigInt(0)) throw new Error("Enter an amount greater than zero.");
      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const token = new Contract(CONTRACTS.token, TOKEN_ABI, signer);
      await sendTransaction("Transfer VSC", () => token.transfer(recipient, amount));
    } catch (txError) {
      setError(errorMessage(txError));
    }
  }

  async function approveSpending(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAddress(spender)) {
      setError("Enter a valid spender contract or wallet address.");
      return;
    }
    if (!activeWallet) {
      setError("Connect a wallet before submitting a transaction.");
      return;
    }
    try {
      const amount = parseUnits(approvalAmount, 18);
      if (amount <= BigInt(0)) throw new Error("Enter an amount greater than zero.");
      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const token = new Contract(CONTRACTS.token, TOKEN_ABI, signer);
      await sendTransaction("Approve VSC spending", () => token.approve(spender, amount));
    } catch (txError) {
      setError(errorMessage(txError));
    }
  }

  const explorer = "https://sepolia.etherscan.io";

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Vistacoin home">
          <span className="brand-mark">V</span>
          <span>VISTACOIN</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#dashboard">Dashboard</a>
          <Link className="nav-link" href="/staking">Staking</Link>
          <Link className="nav-link" href="/escrow">Escrow</Link>
          <Link className="nav-link" href="/governance">Governance</Link>
          <Link className="nav-link" href="/ico">Presale</Link>
          <a className="nav-link" href="https://fly-aerovista.emergent.host" target="_blank" rel="noopener noreferrer">AeroVista</a>
        </nav>
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
                {connectedWallet ? `Connect ${connectedWallet.name}` : "Connect wallet"}
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="hero" id="dashboard">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> SEPOLIA TESTNET</p>
          <h1>Vistacoin<br /><span>token dashboard</span></h1>
          <p className="hero-description">
            Your VSC portfolio and on-chain controls, connected to the Sepolia smoke-tested deployment.
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
              <button className="primary-button secondary-action" onClick={() => void refresh()} disabled={loading}>
                {loading ? "Refreshing…" : "Refresh balances"}
              </button>
            )}
            <a
              className="text-link"
              href={`${explorer}/address/${CONTRACTS.token}`}
              target="_blank"
              rel="noreferrer"
            >
              View token contract <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-outer" />
          <div className="orbit orbit-inner" />
          <div className="coin-core">V</div>
          <span className="orbit-label label-top">VSC / ETH</span>
          <span className="orbit-label label-bottom">SEPOLIA · 11155111</span>
          <span className="orbit-star star-one">✳</span>
          <span className="orbit-star star-two">✳</span>
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

      <section className="metric-grid" aria-label="Wallet overview">
        <article className="metric-card balance-card">
          <div className="metric-head">
            <span className="metric-label">YOUR VSC BALANCE</span>
            <span className="metric-icon">V</span>
          </div>
          <div className="metric-value">
            {tokenData && account ? formatTokenAmount(tokenData.balance) : "—"} <span>VSC</span>
          </div>
          <div className="metric-foot">
            {account ? shortenAddress(account) : "Connect wallet to view your balance"}
            {loading && <span className="loading-indicator">Updating</span>}
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-head">
            <span className="metric-label">SEPOLIA ETH</span>
            <span className="metric-icon eth-icon">Ξ</span>
          </div>
          <div className="metric-value">{tokenData && account ? formatEth(tokenData.nativeBalance) : "—"} <span>ETH</span></div>
          <div className="metric-foot">{account ? "Wallet gas balance" : "Connect wallet to view balance"}</div>
        </article>
        <article className="metric-card">
          <div className="metric-head">
            <span className="metric-label">TRANSFER BURN</span>
            <span className="metric-icon burn-icon">↘</span>
          </div>
          <div className="metric-value">
            {tokenData ? (Number(tokenData.burnBasisPoints) / 100).toFixed(2) : "—"}<span>%</span>
          </div>
          <div className="metric-foot">Applied on VSC transfers</div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel token-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ASSET OVERVIEW</p>
              <h2>Vistacoin token</h2>
            </div>
            <span className="panel-symbol">VSC</span>
          </div>
          <div className="token-identity">
            <div className="token-avatar">V</div>
            <div>
              <h3>{tokenData?.name ?? "Vistacoin"}</h3>
              <p>{tokenData?.symbol ?? "VSC"} · ERC-20</p>
            </div>
            <span className={`read-status ${tokenData ? "read-live" : ""}`}>
              <span className="status-dot" />
              {tokenData ? "LIVE DATA" : "LOADING DATA"}
            </span>
          </div>
          <div className="detail-list">
            <div className="detail-row">
              <span>Total supply</span>
              <strong>{tokenData ? `${formatTokenAmount(tokenData.totalSupply)} VSC` : "Loading…"}</strong>
            </div>
            <div className="detail-row">
              <span>Network</span>
              <strong>Sepolia <span className="chain-id">11155111</span></strong>
            </div>
            <div className="detail-row contract-row">
              <span>Token contract</span>
              <a href={`${explorer}/address/${CONTRACTS.token}`} target="_blank" rel="noreferrer">
                {shortenAddress(CONTRACTS.token)} <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <div className="release-note">
            <span className="release-check">✓</span>
            <span>Deployment <strong>{DEPLOYED_SOURCE.tag}</strong></span>
            <a
              href={`https://github.com/marcellesteer-cloud/vistacion-blockchain/tree/${DEPLOYED_SOURCE.tag}`}
              target="_blank"
              rel="noreferrer"
              aria-label="View deployed source release"
            >
              ↗
            </a>
          </div>
        </article>

        <article className="panel actions-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ON-CHAIN CONTROLS</p>
              <h2>Token actions</h2>
            </div>
            <span className="secure-label"><span className="secure-dot" /> SELF-CUSTODY</span>
          </div>
          {!activeWallet ? (
            <div className="wallet-prompt">
              <div className="prompt-icon">⌁</div>
              <h3>Connect your wallet</h3>
              <p>Connect an injected wallet to read your balances and submit VSC transactions.</p>
              <button className="primary-button" onClick={connectWallet}>Connect wallet</button>
              <span className="wallet-support">MetaMask · Rabby · Coinbase Wallet</span>
            </div>
          ) : !isSepolia ? (
            <div className="wallet-prompt">
              <div className="prompt-icon warning-prompt">!</div>
              <h3>Wrong network</h3>
              <p>Switch your wallet to Sepolia before reading or submitting token transactions.</p>
              <button className="primary-button" onClick={switchToSepolia}>Switch to Sepolia</button>
            </div>
          ) : (
            <div className="forms-stack">
              <form className="action-form" onSubmit={transferTokens}>
                <div className="form-title">
                  <span className="form-icon">↗</span>
                  <div><h3>Transfer VSC</h3><p>Recipient receives the amount after burn.</p></div>
                </div>
                <label htmlFor="recipient">Recipient address</label>
                <input
                  id="recipient"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  placeholder="0x…"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
                <label htmlFor="transfer-amount">Amount</label>
                <div className="amount-input">
                  <input
                    id="transfer-amount"
                    value={transferAmount}
                    onChange={(event) => setTransferAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    required
                  />
                  <span>VSC</span>
                </div>
                {transferPreview && (
                  <p className="form-hint">Estimated recipient amount <strong>{transferPreview} VSC</strong> after burn</p>
                )}
                <button className="submit-button" type="submit" disabled={working || !transferAmount || !recipient}>
                  {working ? "Waiting for wallet…" : "Review transfer"} <span aria-hidden="true">→</span>
                </button>
              </form>

              <form className="action-form approval-form" onSubmit={approveSpending}>
                <div className="form-title">
                  <span className="form-icon approval-icon">◎</span>
                  <div><h3>Approve spending</h3><p>Set a token allowance for a contract.</p></div>
                </div>
                <label htmlFor="spender">Spender address</label>
                <input
                  id="spender"
                  value={spender}
                  onChange={(event) => setSpender(event.target.value)}
                  placeholder="Contract or wallet address"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
                <label htmlFor="approval-amount">Allowance</label>
                <div className="amount-input">
                  <input
                    id="approval-amount"
                    value={approvalAmount}
                    onChange={(event) => setApprovalAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    required
                  />
                  <span>VSC</span>
                </div>
                <p className="form-hint">Approval authorizes spending; it does not transfer tokens.</p>
                <button className="submit-button outline-button" type="submit" disabled={working || !approvalAmount || !spender}>
                  {working ? "Waiting for wallet…" : "Approve allowance"} <span aria-hidden="true">→</span>
                </button>
              </form>
            </div>
          )}
        </article>
      </section>

      <footer className="site-footer">
        <span>VISTACOIN <span className="footer-muted">· SEPOLIA TESTNET</span></span>
        <span>Testnet interface · Verify every transaction in your wallet</span>
        <a href={`${explorer}/address/${CONTRACTS.token}`} target="_blank" rel="noreferrer">Etherscan ↗</a>
      </footer>
    </main>
  );
}
