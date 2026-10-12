"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BrowserProvider,
  Contract,
  formatUnits,
  isAddress,
  parseUnits,
  type TransactionResponse,
} from "ethers";
import { ESCROW_ABI, TOKEN_ABI } from "@/src/config/abi";
import { CONTRACTS } from "@/src/config/contracts";
import { NETWORKS, SEPOLIA_CHAIN_ID } from "@/src/config/networks";
import {
  getInjectedWallets,
  type InjectedWallet,
} from "@/src/lib/injected-wallet";
import { getSepoliaReadProvider } from "@/src/lib/sepolia-read-provider";

interface EscrowDeal {
  id: bigint;
  buyer: string;
  seller: string;
  amount: bigint;
  docsSubmitted: boolean;
  resolved: boolean;
}

interface EscrowData {
  oracle: string;
  tokenBalance: bigint;
  allowance: bigint;
  burnBasisPoints: bigint;
  nextId: bigint;
  deals: EscrowDeal[];
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

function compareAddresses(first: string, second: string): boolean {
  return first.toLowerCase() === second.toLowerCase();
}

function dealStatus(deal: EscrowDeal): string {
  if (deal.resolved) return "Resolved";
  if (deal.docsSubmitted) return "Awaiting oracle";
  return "Awaiting documents";
}

export default function EscrowPage() {
  const [wallets, setWallets] = useState<InjectedWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState(0);
  const [activeWallet, setActiveWallet] = useState<InjectedWallet | null>(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [data, setData] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [transaction, setTransaction] = useState<TransactionState | null>(null);
  const [sellerAddress, setSellerAddress] = useState("");
  const [dealAmount, setDealAmount] = useState("");
  const [approvalAmount, setApprovalAmount] = useState("");
  const [dealToSubmit, setDealToSubmit] = useState("");

  const isSepolia = !activeWallet || chainId === SEPOLIA_CHAIN_ID;
  const selectedWalletOption = wallets[selectedWallet];
  const isOracle = Boolean(data && account && compareAddresses(account, data.oracle));
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
      const escrow = new Contract(CONTRACTS.escrow, ESCROW_ABI, provider);
      const [oracle, tokenBalance, allowance, burnBasisPoints, nextId] =
        await Promise.all([
          escrow.oracle() as Promise<string>,
          account ? token.balanceOf(account) as Promise<bigint> : Promise.resolve(BigInt(0)),
          account ? token.allowance(account, CONTRACTS.escrow) as Promise<bigint> : Promise.resolve(BigInt(0)),
          token.burnBasisPoints() as Promise<bigint>,
          escrow.nextId() as Promise<bigint>,
        ]);

      const recentCount = nextId > BigInt(50) ? BigInt(50) : nextId;
      const dealIds = Array.from({ length: Number(recentCount) }, (_, index) =>
        nextId - BigInt(index + 1),
      );
      const deals = await Promise.all(
        dealIds.map(async (id) => {
          const result = (await escrow.deals(id)) as readonly [
            string,
            string,
            bigint,
            boolean,
            boolean,
          ];
          return {
            id,
            buyer: result[0],
            seller: result[1],
            amount: result[2],
            docsSubmitted: result[3],
            resolved: result[4],
          };
        }),
      );

      setData({
        oracle,
        tokenBalance,
        allowance,
        burnBasisPoints,
        nextId,
        deals,
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
    const interval = window.setInterval(() => void refresh(), 30_000);
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

  async function approveEscrow(event: FormEvent<HTMLFormElement>) {
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
      await sendTransaction("Escrow token approval", () =>
        token.approve(CONTRACTS.escrow, amount),
      );
    } catch (approvalError) {
      setError(errorMessage(approvalError));
    }
  }

  async function createDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeWallet) {
      setError("Connect a wallet before creating a deal.");
      return;
    }
    if (!isAddress(sellerAddress) || compareAddresses(sellerAddress, account)) {
      setError("Enter a valid seller address that is different from your wallet.");
      return;
    }
    try {
      const amount = parseUnits(dealAmount, 18);
      if (amount <= BigInt(0)) throw new Error("Enter an amount greater than zero.");
      if (data && amount > data.tokenBalance) {
        throw new Error("Deal amount exceeds your VSC wallet balance.");
      }
      if (data && amount > data.allowance) {
        throw new Error("Approve the escrow contract for this amount before creating the deal.");
      }
      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const escrow = new Contract(CONTRACTS.escrow, ESCROW_ABI, signer);
      await sendTransaction("Create escrow deal", () =>
        escrow.createEscrow(sellerAddress, amount),
      );
      setDealAmount("");
      setSellerAddress("");
    } catch (createError) {
      setError(errorMessage(createError));
    }
  }

  async function submitDocuments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeWallet) {
      setError("Connect a wallet before submitting deal documents.");
      return;
    }
    try {
      const id = BigInt(dealToSubmit);
      const deal = data?.deals.find((item) => item.id === id);
      if (!deal) throw new Error("That deal is not in the currently loaded recent deals.");
      if (!compareAddresses(deal.seller, account)) {
        throw new Error("Only the seller can mark documents as submitted.");
      }
      if (deal.resolved) throw new Error("This deal has already been resolved.");

      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const escrow = new Contract(CONTRACTS.escrow, ESCROW_ABI, signer);
      await sendTransaction("Mark deal documents submitted", () =>
        escrow.submitDocs(id),
      );
      setDealToSubmit("");
    } catch (submitError) {
      setError(errorMessage(submitError));
    }
  }

  async function resolveDeal(deal: EscrowDeal, approved: boolean) {
    if (!activeWallet) {
      setError("Connect the authorized oracle wallet to resolve deals.");
      return;
    }
    if (!isOracle) {
      setError("Only the contract’s authorized oracle can approve release or reject for refund.");
      return;
    }
    if (deal.resolved || !deal.docsSubmitted) {
      setError("This deal is not ready for oracle resolution.");
      return;
    }

    try {
      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const escrow = new Contract(CONTRACTS.escrow, ESCROW_ABI, signer);
      await sendTransaction(
        approved ? "Approve seller payment" : "Reject and refund buyer",
        () => escrow.verifyAndRelease(deal.id, approved),
      );
    } catch (resolveError) {
      setError(errorMessage(resolveError));
    }
  }

  const dealPreview =
    data && dealAmount
      ? formatInputAmount(dealAmount, data.burnBasisPoints)
      : "";
  const roleLabel = (deal: EscrowDeal) => {
    if (!account) return "";
    if (compareAddresses(account, deal.buyer) && compareAddresses(account, deal.seller)) {
      return "You are buyer and seller";
    }
    if (compareAddresses(account, deal.buyer)) return "You are buyer";
    if (compareAddresses(account, deal.seller)) return "You are seller";
    return "";
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Vistacoin home">
          <span className="brand-mark">V</span>
          <span>VISTACOIN</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link className="nav-link" href="/dashboard">Dashboard</Link>
          <Link className="nav-link" href="/staking">Staking</Link>
          <Link className="nav-link active" href="/escrow">Escrow</Link>
          <Link className="nav-link" href="/governance">Governance</Link>
          <Link className="nav-link" href="/ico">Presale</Link>
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
                {selectedWalletOption ? `Connect ${selectedWalletOption.name}` : "Connect wallet"}
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="hero escrow-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> VISTACOIN ESCROW · SEPOLIA</p>
          <h1>Deals with<br /><span>clear outcomes.</span></h1>
          <p className="hero-description">
            Hold VSC in escrow while work is completed. The authorized oracle reviews submission and approves release or buyer refund.
          </p>
          <div className="hero-actions">
            {activeWallet && !isSepolia ? (
              <button className="primary-button" onClick={switchToSepolia}>Switch to Sepolia</button>
            ) : !activeWallet ? (
              <button className="primary-button" onClick={connectWallet}>
                Connect wallet <span aria-hidden="true">↗</span>
              </button>
            ) : (
              <button className="primary-button secondary-action" onClick={() => void refresh()} disabled={loading}>
                {loading ? "Refreshing…" : "Refresh deals"}
              </button>
            )}
            <a
              className="text-link"
              href={`${explorer}/address/${CONTRACTS.escrow}`}
              target="_blank"
              rel="noreferrer"
            >
              View escrow contract <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className="escrow-overview-stat">
          <span className="staking-hero-label">DEALS CREATED</span>
          <strong>{data ? data.nextId.toString() : "—"}</strong>
          <span className="staking-hero-foot">Recent 50 shown below</span>
        </div>
      </section>

      <div className="escrow-safety-note">
        <span className="release-check">!</span>
        <span>
          <strong>Testnet only.</strong> Escrow resolutions rely on a designated oracle. This contract stores only a submitted/not-submitted flag; it does not upload or preserve documents. VSC transfers incur a 0.5% burn.
        </span>
      </div>

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

      <section className="metric-grid escrow-metrics" aria-label="Escrow overview">
        <article className="metric-card balance-card">
          <div className="metric-head">
            <span className="metric-label">YOUR VSC BALANCE</span>
            <span className="metric-icon">V</span>
          </div>
          <div className="metric-value">
            {data && account ? formatTokenAmount(data.tokenBalance) : "—"} <span>VSC</span>
          </div>
          <div className="metric-foot">
            {account ? shortenAddress(account) : "Connect wallet to create a deal"}
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-head">
            <span className="metric-label">ESCROW ALLOWANCE</span>
            <span className="metric-icon approval-icon">◎</span>
          </div>
          <div className="metric-value">
            {data && account ? formatTokenAmount(data.allowance) : "—"} <span>VSC</span>
          </div>
          <div className="metric-foot">Approved for this contract</div>
        </article>
        <article className="metric-card">
          <div className="metric-head">
            <span className="metric-label">AUTHORIZED ORACLE</span>
            <span className="metric-icon burn-icon">◆</span>
          </div>
          <div className="metric-value escrow-oracle-value">
            {data ? shortenAddress(data.oracle) : "Loading…"}
          </div>
          <div className="metric-foot">{isOracle ? "This wallet can resolve submitted deals" : "Only this wallet can resolve deals"}</div>
        </article>
      </section>

      <section className="dashboard-grid escrow-dashboard">
        <article className="panel escrow-actions-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">START A TRANSACTION</p>
              <h2>Create a deal</h2>
            </div>
            <span className="secure-label"><span className="secure-dot" /> SELF-CUSTODY</span>
          </div>
          {!activeWallet || !account ? (
            <div className="wallet-prompt">
              <div className="prompt-icon">⌁</div>
              <h3>Connect your wallet</h3>
              <p>Connect an injected wallet to approve VSC and fund an escrow deal.</p>
              <button className="primary-button" onClick={connectWallet}>Connect wallet</button>
              <span className="wallet-support">MetaMask · Rabby · Coinbase Wallet</span>
            </div>
          ) : !isSepolia ? (
            <div className="wallet-prompt">
              <div className="prompt-icon warning-prompt">!</div>
              <h3>Wrong network</h3>
              <p>Switch to Sepolia before creating or managing escrow deals.</p>
              <button className="primary-button" onClick={switchToSepolia}>Switch to Sepolia</button>
            </div>
          ) : (
            <div className="forms-stack escrow-create-forms">
              <form className="action-form" onSubmit={approveEscrow}>
                <div className="form-title">
                  <span className="form-icon approval-icon">◎</span>
                  <div><h3>Approve VSC</h3><p>Allow the escrow contract to transfer your tokens.</p></div>
                </div>
                <label htmlFor="escrow-approval-amount">Allowance amount</label>
                <div className="amount-input">
                  <input
                    id="escrow-approval-amount"
                    value={approvalAmount}
                    onChange={(event) => setApprovalAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    required
                  />
                  <span>VSC</span>
                </div>
                <p className="form-hint">Approve only the amount you intend to place in escrow.</p>
                <button className="submit-button outline-button" type="submit" disabled={working || !approvalAmount}>
                  {working ? "Waiting for wallet…" : "Approve escrow"} <span aria-hidden="true">→</span>
                </button>
              </form>

              <form className="action-form" onSubmit={createDeal}>
                <div className="form-title">
                  <span className="form-icon">＋</span>
                  <div><h3>Fund a new deal</h3><p>VSC is transferred into the escrow contract.</p></div>
                </div>
                <label htmlFor="escrow-seller">Seller wallet address</label>
                <input
                  id="escrow-seller"
                  value={sellerAddress}
                  onChange={(event) => setSellerAddress(event.target.value)}
                  placeholder="0x…"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
                <label htmlFor="escrow-amount">Amount to deposit</label>
                <div className="amount-input">
                  <input
                    id="escrow-amount"
                    value={dealAmount}
                    onChange={(event) => setDealAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    required
                  />
                  <span>VSC</span>
                </div>
                <p className="form-hint">
                  {dealPreview
                    ? `Estimated escrowed amount after burn: ${dealPreview} VSC`
                    : data && dealAmount && amountExceedsLimit(dealAmount, data.allowance)
                      ? "Approve the escrow contract for this amount first."
                      : "The escrow contract records the net amount it receives."}
                </p>
                <button
                  className="submit-button"
                  type="submit"
                  disabled={
                    working ||
                    !sellerAddress ||
                    !dealAmount ||
                    !data ||
                    amountExceedsLimit(dealAmount, data.allowance) ||
                    amountExceedsLimit(dealAmount, data.tokenBalance)
                  }
                >
                  {working ? "Waiting for wallet…" : "Create and fund deal"} <span aria-hidden="true">→</span>
                </button>
                {data && amountExceedsLimit(dealAmount, data.tokenBalance) && (
                  <p className="inline-warning">Amount exceeds your VSC wallet balance.</p>
                )}
              </form>
            </div>
          )}
        </article>

        <article className="panel escrow-submit-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">SELLER ACTION</p>
              <h2>Submit deal documents</h2>
            </div>
            <span className="panel-symbol">SELLER</span>
          </div>
          <p className="escrow-panel-copy">
            Select a deal where you are the seller to record that supporting documents have been submitted.
          </p>
          {!activeWallet || !account ? (
            <div className="inline-connect-prompt">Connect a wallet to manage your seller deals.</div>
          ) : !isSepolia ? (
            <div className="inline-connect-prompt">Switch to Sepolia to submit deal status.</div>
          ) : (
            <form className="action-form escrow-submit-form" onSubmit={submitDocuments}>
              <label htmlFor="escrow-doc-deal">Deal ID</label>
              <select
                id="escrow-doc-deal"
                value={dealToSubmit}
                onChange={(event) => setDealToSubmit(event.target.value)}
                required
              >
                <option value="">Choose a seller deal</option>
                {data?.deals
                  .filter((deal) => compareAddresses(deal.seller, account) && !deal.resolved)
                  .map((deal) => (
                    <option key={deal.id.toString()} value={deal.id.toString()}>
                      #{deal.id.toString()} · {deal.docsSubmitted ? "Submitted" : "Not submitted"} · {formatTokenAmount(deal.amount)} VSC
                    </option>
                  ))}
              </select>
              <div className="document-warning">
                This action records a boolean on-chain only. The contract has no document upload, URI, or file storage.
              </div>
              <button
                className="submit-button"
                type="submit"
                disabled={
                  working ||
                  !dealToSubmit ||
                  !data?.deals.some(
                    (deal) =>
                      deal.id === BigInt(dealToSubmit || "0") &&
                      compareAddresses(deal.seller, account) &&
                      !deal.resolved,
                  )
                }
              >
                {working ? "Waiting for wallet…" : "Mark documents submitted"} <span aria-hidden="true">→</span>
              </button>
            </form>
          )}
        </article>
      </section>

      <section className="panel escrow-deals-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">ON-CHAIN DEAL REGISTER</p>
            <h2>Recent escrow deals</h2>
          </div>
          <div className="deal-list-controls">
            {isOracle && <span className="oracle-badge"><span className="secure-dot" /> ORACLE ACCESS</span>}
            <button className="refresh-button" onClick={() => void refresh()} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
        {!isSepolia ? (
          <div className="empty-deals">
            <p>Switch to Sepolia to view deal records.</p>
            <button className="primary-button" onClick={switchToSepolia}>Switch to Sepolia</button>
          </div>
        ) : data && data.deals.length ? (
          <div className="deal-list">
            {data.deals.map((deal) => {
              const canResolve = isOracle && deal.docsSubmitted && !deal.resolved;
              const currentRole = roleLabel(deal);
              const recipientAmount =
                deal.amount -
                (deal.amount * (data.burnBasisPoints ?? BigInt(0))) / BigInt(10_000);
              return (
                <article className="deal-card" key={deal.id.toString()}>
                  <div className="deal-card-top">
                    <div className="deal-title">
                      <span className="deal-id">DEAL #{deal.id.toString()}</span>
                      <span className={`deal-status ${deal.resolved ? "deal-resolved" : deal.docsSubmitted ? "deal-review" : ""}`}>
                        <span className="status-dot" />
                        {dealStatus(deal)}
                      </span>
                    </div>
                    <div className="deal-amount">
                      <strong>{formatTokenAmount(deal.amount)} <span>VSC</span></strong>
                      <small>recorded in escrow</small>
                    </div>
                  </div>
                  <div className="deal-parties">
                    <div>
                      <span>BUYER</span>
                      <a href={`${explorer}/address/${deal.buyer}`} target="_blank" rel="noreferrer">
                        {shortenAddress(deal.buyer)}
                      </a>
                    </div>
                    <div>
                      <span>SELLER</span>
                      <a href={`${explorer}/address/${deal.seller}`} target="_blank" rel="noreferrer">
                        {shortenAddress(deal.seller)}
                      </a>
                    </div>
                    <div>
                      <span>DOCUMENTS</span>
                      <strong>{deal.docsSubmitted ? "Submitted flag set" : "Not submitted"}</strong>
                    </div>
                    <div>
                      <span>ROLE / OUTCOME</span>
                      <strong>{deal.resolved ? "Resolved on-chain" : currentRole || "Participant"}</strong>
                    </div>
                  </div>
                  {deal.resolved && (
                    <p className="deal-burn-note">
                      The recipient received at most {formatTokenAmount(recipientAmount)} VSC after the outgoing transfer burn.
                    </p>
                  )}
                  {canResolve && (
                    <div className="deal-resolution-actions">
                      <span>Oracle decision</span>
                      <button
                        className="submit-button approve-release"
                        onClick={() => void resolveDeal(deal, true)}
                        disabled={working}
                      >
                        Approve release
                      </button>
                      <button
                        className="submit-button reject-refund"
                        onClick={() => void resolveDeal(deal, false)}
                        disabled={working}
                      >
                        Reject / refund
                      </button>
                    </div>
                  )}
                  {isOracle && !deal.resolved && !deal.docsSubmitted && (
                    <p className="deal-burn-note">Resolution is locked until the seller submits documents.</p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-deals">
            <p>{data ? "No escrow deals have been created yet on this deployment." : "Loading public escrow records…"}</p>
            {!activeWallet && <button className="primary-button" onClick={connectWallet}>Connect wallet to create a deal</button>}
          </div>
        )}
        {data && data.nextId > BigInt(50) && (
          <p className="deal-list-footnote">
            Showing the latest 50 of {data.nextId.toString()} deals. Earlier records remain available on Sepolia Etherscan.
          </p>
        )}
      </section>

      <footer className="site-footer">
        <span>VISTACOIN <span className="footer-muted">· SEPOLIA TESTNET</span></span>
        <span>Oracle-mediated testnet escrow · Verify every transaction in your wallet</span>
        <a href={`${explorer}/address/${CONTRACTS.escrow}`} target="_blank" rel="noreferrer">
          Etherscan ↗
        </a>
      </footer>
    </main>
  );
}
