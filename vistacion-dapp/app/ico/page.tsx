"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BrowserProvider,
  Contract,
  formatEther,
  formatUnits,
  parseEther,
  type TransactionResponse,
} from "ethers";
import { ICO_ABI, TOKEN_ABI } from "@/src/config/abi";
import { CONTRACTS } from "@/src/config/contracts";
import { NETWORKS, SEPOLIA_CHAIN_ID } from "@/src/config/networks";
import {
  getInjectedWallets,
  type InjectedWallet,
} from "@/src/lib/injected-wallet";
import { getSepoliaReadProvider } from "@/src/lib/sepolia-read-provider";

interface IcoData {
  priceWeiPerToken: bigint;
  start: bigint;
  end: bigint;
  treasury: string;
  inventory: bigint;
  burnBasisPoints: bigint;
  ethBalance: bigint | null;
}

interface PurchaseQuote {
  payment: bigint;
  quotedTokens: bigint;
  grossInventory: bigint;
  receivesTokens: bigint;
  burnTokens: bigint;
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
    maximumFractionDigits: 6,
  });
}

function formatEth(value: bigint): string {
  return Number(formatEther(value)).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getInjectedChainId(value: unknown): number | null {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) return null;
  return Number.parseInt(value, 16);
}

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}

function buildQuote(ethAmount: string, data: IcoData | null): PurchaseQuote | null {
  if (!data || !ethAmount || !/^\d+(\.\d+)?$/.test(ethAmount)) return null;
  try {
    const payment = parseEther(ethAmount);
    const quotedTokens = (payment * BigInt(10) ** BigInt(18)) / data.priceWeiPerToken;
    if (payment <= BigInt(0) || quotedTokens <= BigInt(0)) return null;
    const divisor = BigInt(10_000) - data.burnBasisPoints;
    if (divisor <= BigInt(0)) return null;
    const grossInventory =
      (quotedTokens * BigInt(10_000) + divisor - BigInt(1)) / divisor;
    return {
      payment,
      quotedTokens,
      grossInventory,
      receivesTokens: quotedTokens,
      burnTokens: grossInventory - quotedTokens,
    };
  } catch {
    return null;
  }
}

export default function ICOPage() {
  const [wallets, setWallets] = useState<InjectedWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState(0);
  const [activeWallet, setActiveWallet] = useState<InjectedWallet | null>(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [data, setData] = useState<IcoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [transaction, setTransaction] = useState<TransactionState | null>(null);
  const [ethAmount, setEthAmount] = useState("");
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  const isSepolia = chainId === SEPOLIA_CHAIN_ID;
  const selectedWalletOption = wallets[selectedWallet];
  const explorer = "https://sepolia.etherscan.io";
  const quote = buildQuote(ethAmount, data);
  const saleOpen = Boolean(data && BigInt(now) >= data.start && BigInt(now) <= data.end);
  const saleUpcoming = Boolean(data && BigInt(now) < data.start);
  const saleEnded = Boolean(data && BigInt(now) > data.end);
  const saleStatus = !data
    ? error
      ? "Sale data unavailable"
      : "Loading sale data"
    : saleOpen
      ? "Sale open"
      : saleUpcoming
        ? "Sale opens soon"
        : "Sale ended";

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
      const ico = new Contract(CONTRACTS.ico, ICO_ABI, provider);
      const [
        priceWeiPerToken,
        start,
        end,
        treasury,
        inventory,
        burnBasisPoints,
        ethBalance,
      ] = await Promise.all([
        ico.priceWeiPerToken() as Promise<bigint>,
        ico.start() as Promise<bigint>,
        ico.end() as Promise<bigint>,
        ico.treasury() as Promise<string>,
        token.balanceOf(CONTRACTS.ico) as Promise<bigint>,
        token.burnBasisPoints() as Promise<bigint>,
        account ? provider.getBalance(account) : Promise.resolve(null),
      ]);
      setData({
        priceWeiPerToken,
        start,
        end,
        treasury,
        inventory,
        burnBasisPoints,
        ethBalance,
      });
      setNow(Math.floor(Date.now() / 1000));
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
      setAccount(typeof accounts[0] === "string" ? accounts[0] : "");
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
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [account, activeWallet, refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 15_000);
    return () => window.clearInterval(interval);
  }, []);

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
      setError("Connect a wallet on Sepolia before purchasing.");
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
      setEthAmount("");
      await refresh();
    } catch (transactionError) {
      setError(errorMessage(transactionError));
      setTransaction(null);
    } finally {
      setWorking(false);
    }
  }

  async function purchaseTokens() {
    if (!activeWallet || !data || !quote) {
      setError("Enter a valid ETH amount and connect a Sepolia wallet.");
      return;
    }
    if (data.ethBalance === null) {
      setError("Connect your wallet to load your Sepolia ETH balance.");
      return;
    }
    if (!saleOpen) {
      setError("The token sale is not currently open.");
      return;
    }
    if (quote.grossInventory > data.inventory) {
      setError("The ICO contract does not have enough inventory for this purchase.");
      return;
    }
    if (quote.payment >= data.ethBalance) {
      setError("Keep enough Sepolia ETH in your wallet to cover transaction gas.");
      return;
    }
    try {
      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const ico = new Contract(CONTRACTS.ico, ICO_ABI, signer);
      await sendTransaction("Buy VSC", () => ico.buy({ value: quote.payment }));
    } catch (purchaseError) {
      setError(errorMessage(purchaseError));
    }
  }

  const remainingSeconds =
    data && saleUpcoming
      ? Math.max(0, Number(data.start) - now)
      : data && saleOpen
        ? Math.max(0, Number(data.end) - now)
        : 0;
  const countdown = `${Math.floor(remainingSeconds / 86_400)}d ${Math.floor((remainingSeconds % 86_400) / 3_600)}h ${Math.floor((remainingSeconds % 3_600) / 60)}m`;

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Vistacoin home"><span className="brand-mark">V</span><span>VISTACOIN</span></Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link className="nav-link" href="/">Dashboard</Link>
          <Link className="nav-link" href="/staking">Staking</Link>
          <Link className="nav-link" href="/escrow">Escrow</Link>
          <Link className="nav-link" href="/governance">Governance</Link>
          <Link className="nav-link active" href="/ico">Presale</Link>
        </nav>
        <a className="aerovista-button" href="https://fly-aerovista.emergent.host" target="_blank" rel="noopener noreferrer">AeroVista Club <span aria-hidden="true">↗</span></a>
        <div className="wallet-controls">
          {activeWallet && account ? (
            <>
              <span className={`network-pill ${isSepolia ? "connected" : "warning"}`}><span className="status-dot" />{isSepolia ? "Sepolia" : `Chain ${chainId ?? "unknown"}`}</span>
              <button className="wallet-button connected-wallet" onClick={disconnectWallet}>{shortenAddress(account)}<span className="wallet-action">Disconnect</span></button>
            </>
          ) : (
            <div className="connect-row">
              {wallets.length > 1 && <select aria-label="Choose wallet" value={selectedWallet} onChange={(event) => setSelectedWallet(Number(event.target.value))} className="wallet-select">{wallets.map((wallet, index) => <option key={`${wallet.name}-${index}`} value={index}>{wallet.name}</option>)}</select>}
              <button className="wallet-button" onClick={connectWallet}>{selectedWalletOption ? `Connect ${selectedWalletOption.name}` : "Connect wallet"}</button>
            </div>
          )}
        </div>
      </header>

      <section className="hero ico-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> VSC TOKEN SALE · SEPOLIA</p>
          <h1>Join the<br /><span>Vistacoin sale.</span></h1>
          <p className="hero-description">Review the live sale terms, calculate your VSC quote, and purchase directly through the deployed ICO contract.</p>
          <div className="hero-actions">
            {activeWallet && !isSepolia ? (
              <button className="primary-button" onClick={switchToSepolia}>Switch to Sepolia</button>
            ) : !activeWallet ? (
              <button className="primary-button" onClick={connectWallet}>Connect wallet <span aria-hidden="true">↗</span></button>
            ) : (
              <button className="primary-button secondary-action" onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "Refresh sale data"}</button>
            )}
            <a className="text-link" href={`${explorer}/address/${CONTRACTS.ico}`} target="_blank" rel="noreferrer">View ICO contract <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="ico-status-card">
          <span className="staking-hero-label">SALE STATUS</span>
          <strong className={saleOpen ? "ico-open" : ""}><span className="status-dot" />{saleStatus}</strong>
          <span className="staking-hero-foot">{data && (saleOpen || saleUpcoming) ? `${saleUpcoming ? "Opens in" : "Ends in"} ${countdown}` : data ? "See sale period below" : "Connect wallet to read live sale state"}</span>
        </div>
      </section>

      <div className="escrow-safety-note ico-testnet-note">
        <span className="release-check">!</span>
        <span><strong>Sepolia testnet only.</strong> VSC and Sepolia ETH are test assets. Purchase sends ETH to the configured treasury and transfers an automatically burn-adjusted gross amount of VSC from ICO inventory.</span>
      </div>

      {error && <div className="notice error-notice" role="alert"><span className="notice-icon">!</span><span>{error}</span><button className="notice-close" onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
      {transaction && (
        <div className={`notice transaction-notice ${transaction.complete ? "success-notice" : ""}`} role="status">
          <span className="notice-icon">{transaction.complete ? "✓" : "…"}</span>
          <span>{transaction.complete ? `${transaction.label} confirmed` : `${transaction.label} submitted`}{transaction.hash && <>{" · "}<a href={`${explorer}/tx/${transaction.hash}`} target="_blank" rel="noreferrer">View transaction</a></>}</span>
          <button className="notice-close" onClick={() => setTransaction(null)} aria-label="Dismiss transaction status">×</button>
        </div>
      )}

      <section className="metric-grid ico-metrics" aria-label="Token sale information">
        <article className="metric-card balance-card"><div className="metric-head"><span className="metric-label">ICO INVENTORY</span><span className="metric-icon">V</span></div><div className="metric-value">{data ? formatTokenAmount(data.inventory) : "—"} <span>VSC</span></div><div className="metric-foot">VSC held by the sale contract</div></article>
        <article className="metric-card"><div className="metric-head"><span className="metric-label">PRICE PER VSC</span><span className="metric-icon eth-icon">Ξ</span></div><div className="metric-value">{data ? `${formatEther(data.priceWeiPerToken)} ` : "—"}<span>ETH</span></div><div className="metric-foot">Live price from ICO contract</div></article>
        <article className="metric-card"><div className="metric-head"><span className="metric-label">YOUR SEPOLIA ETH</span><span className="metric-icon eth-icon">Ξ</span></div><div className="metric-value">{data?.ethBalance !== null && data?.ethBalance !== undefined ? formatEth(data.ethBalance) : "—"} <span>ETH</span></div><div className="metric-foot">{account ? "Wallet balance for purchase and gas" : "Connect wallet to view your balance"}</div></article>
      </section>

      <section className="dashboard-grid ico-dashboard">
        <article className="panel ico-purchase-panel">
          <div className="panel-heading"><div><p className="eyebrow">PURCHASE VSC</p><h2>Calculate your purchase</h2></div><span className={`deal-status ${saleOpen ? "deal-resolved" : ""}`}><span className="status-dot" />{saleStatus}</span></div>
          <div className="ico-purchase-content">
              <label htmlFor="ico-eth-amount">Pay with Sepolia ETH</label>
              <div className="amount-input ico-eth-input"><input id="ico-eth-amount" value={ethAmount} onChange={(event) => setEthAmount(event.target.value)} inputMode="decimal" placeholder="0.001" /><span>ETH</span></div>
              <p className="form-hint">Check the quoted amount and keep enough ETH aside for gas.</p>
              <div className="ico-quote">
                <div className="detail-row"><span>Quoted VSC</span><strong>{quote ? `${formatTokenAmount(quote.quotedTokens)} VSC` : "Enter ETH amount"}</strong></div>
                <div className="detail-row"><span>Estimated gross inventory debit</span><strong>{quote ? `${formatTokenAmount(quote.grossInventory)} VSC` : "—"}</strong></div>
                <div className="detail-row"><span>Estimated burn</span><strong>{quote ? `${formatTokenAmount(quote.burnTokens)} VSC` : "—"}</strong></div>
                <div className="detail-row"><span>Expected buyer receipt</span><strong>{quote ? `${formatTokenAmount(quote.receivesTokens)} VSC minimum` : "—"}</strong></div>
              </div>
              {quote && data && quote.grossInventory > data.inventory && <p className="inline-warning">Purchase exceeds the available ICO inventory.</p>}
              {quote && data?.ethBalance !== null && data?.ethBalance !== undefined && quote.payment >= data.ethBalance && <p className="inline-warning">Insufficient ETH for payment plus gas.</p>}
              <button
                className="submit-button ico-buy-button"
                type="button"
                onClick={() => {
                  if (!activeWallet || !account) void connectWallet();
                  else if (!isSepolia) void switchToSepolia();
                  else void purchaseTokens();
                }}
                disabled={working || !quote || !saleOpen || !data || quote.grossInventory > data.inventory || Boolean(activeWallet && account && data.ethBalance !== null && quote.payment >= data.ethBalance)}
              >
                {working
                  ? "Waiting for wallet…"
                  : !data
                    ? "Loading sale terms…"
                    : !activeWallet || !account
                      ? "Connect wallet to continue"
                      : !isSepolia
                        ? "Switch to Sepolia"
                        : !saleOpen
                          ? saleStatus
                          : "Buy VSC"} <span aria-hidden="true">→</span>
              </button>
              {saleEnded && <p className="form-hint">The purchase function is closed after the sale end time.</p>}
          </div>
        </article>

        <article className="panel ico-terms-panel">
          <div className="panel-heading"><div><p className="eyebrow">ON-CHAIN SALE TERMS</p><h2>Sale details</h2></div><span className="panel-symbol">SEPOLIA</span></div>
          <div className="detail-list">
            <div className="detail-row"><span>Sale starts</span><strong>{data ? formatDate(data.start) : "Connect wallet"}</strong></div>
            <div className="detail-row"><span>Sale ends</span><strong>{data ? formatDate(data.end) : "Connect wallet"}</strong></div>
            <div className="detail-row"><span>Configured treasury</span><a href={data ? `${explorer}/address/${data.treasury}` : "#"} target="_blank" rel="noreferrer">{data ? shortenAddress(data.treasury) : "—"} {data && <span aria-hidden="true">↗</span>}</a></div>
            <div className="detail-row"><span>Token transfer burn</span><strong>{data ? `${Number(data.burnBasisPoints) / 100}%` : "—"}</strong></div>
            <div className="detail-row"><span>Contract inventory</span><strong>{data ? `${formatTokenAmount(data.inventory)} VSC` : "—"}</strong></div>
          </div>
          <div className="release-note ico-accounting-note"><span className="release-check">i</span><span>The ICO grosses up the transfer so the buyer receives the quoted VSC amount after burn, if inventory is sufficient.</span></div>
          <div className="ico-total-raised-note">ETH raised is not shown: this deployed contract has no total-raised counter or purchase event to read as a reliable total.</div>
        </article>
      </section>

      <footer className="site-footer"><span>VISTACOIN <span className="footer-muted">· SEPOLIA TESTNET</span></span><span>Token sale prototype · Confirm amount and transaction details in wallet</span><a href={`${explorer}/address/${CONTRACTS.ico}`} target="_blank" rel="noreferrer">Etherscan ↗</a></footer>
    </main>
  );
}
