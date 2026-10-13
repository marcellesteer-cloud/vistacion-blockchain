"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BrowserProvider,
  Contract,
  formatUnits,
  type TransactionResponse,
} from "ethers";
import { GOVERNANCE_ABI, TOKEN_ABI } from "@/src/config/abi";
import { CONTRACTS } from "@/src/config/contracts";
import { NETWORKS, SEPOLIA_CHAIN_ID } from "@/src/config/networks";
import {
  getInjectedWallets,
  type InjectedWallet,
} from "@/src/lib/injected-wallet";
import { getSepoliaReadProvider } from "@/src/lib/sepolia-read-provider";

interface Proposal {
  id: bigint;
  description: string;
  endTime: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  executed: boolean;
  alreadyVoted: boolean;
}

interface GovernanceData {
  tokenBalance: bigint;
  proposals: Proposal[];
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

function proposalStatus(proposal: Proposal, now: number): string {
  if (proposal.executed) return "Executed";
  if (now < Number(proposal.endTime)) return "Voting open";
  if (proposal.forVotes > proposal.againstVotes) return "Passed · ready to execute";
  return "Ended · not approved";
}

function isCallException(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error &&
    error.code === "CALL_EXCEPTION";
}

export default function GovernancePage() {
  const [wallets, setWallets] = useState<InjectedWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState(0);
  const [activeWallet, setActiveWallet] = useState<InjectedWallet | null>(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [transaction, setTransaction] = useState<TransactionState | null>(null);
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

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
      const governance = new Contract(CONTRACTS.governance, GOVERNANCE_ABI, provider);
      const tokenBalance = account
        ? await token.balanceOf(account) as bigint
        : BigInt(0);
      const proposals: Proposal[] = [];

      // The deployed contract exposes indexed getters but no public proposal count.
      for (let index = 0; index < 100; index += 1) {
        let rawProposal: readonly [string, bigint, bigint, bigint, boolean];
        try {
          rawProposal = await governance.proposals(BigInt(index)) as readonly [
            string,
            bigint,
            bigint,
            bigint,
            boolean,
          ];
        } catch (readError) {
          if (isCallException(readError)) break;
          throw readError;
        }
        const alreadyVoted = account
          ? await governance.voted(BigInt(index), account) as boolean
          : false;
        proposals.push({
          id: BigInt(index),
          description: rawProposal[0],
          endTime: rawProposal[1],
          forVotes: rawProposal[2],
          againstVotes: rawProposal[3],
          executed: rawProposal[4],
          alreadyVoted,
        });
      }

      setData({ tokenBalance, proposals: proposals.reverse() });
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

  async function createProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeWallet) {
      setError("Connect a wallet before creating a proposal.");
      return;
    }
    const trimmed = description.trim();
    if (!trimmed) {
      setError("Enter a proposal description.");
      return;
    }
    if (!data || data.tokenBalance <= BigInt(0)) {
      setError("This contract requires a positive VSC balance to create a proposal.");
      return;
    }
    try {
      const days = Number(durationDays);
      if (!Number.isInteger(days) || days < 1 || days > 365) {
        throw new Error("Choose a voting duration from 1 to 365 days.");
      }
      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const governance = new Contract(CONTRACTS.governance, GOVERNANCE_ABI, signer);
      await sendTransaction("Create governance proposal", () =>
        governance.createProposal(trimmed, BigInt(days * 24 * 60 * 60)),
      );
      setDescription("");
    } catch (createError) {
      setError(errorMessage(createError));
    }
  }

  async function castVote(proposal: Proposal, support: boolean) {
    if (!activeWallet) {
      setError("Connect a wallet before voting.");
      return;
    }
    if (!data || data.tokenBalance <= BigInt(0)) {
      setError("This contract requires a positive VSC balance to vote.");
      return;
    }
    if (proposal.alreadyVoted) {
      setError("This wallet has already voted on this proposal.");
      return;
    }
    if (BigInt(now) >= proposal.endTime) {
      setError("The voting period has ended.");
      return;
    }
    try {
      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const governance = new Contract(CONTRACTS.governance, GOVERNANCE_ABI, signer);
      await sendTransaction(
        support ? "Vote for proposal" : "Vote against proposal",
        () => governance.vote(proposal.id, support),
      );
    } catch (voteError) {
      setError(errorMessage(voteError));
    }
  }

  async function executeProposal(proposal: Proposal) {
    if (!activeWallet) {
      setError("Connect a wallet before executing a proposal.");
      return;
    }
    if (BigInt(now) < proposal.endTime || proposal.forVotes <= proposal.againstVotes) {
      setError("Only ended proposals with more for than against votes can be executed.");
      return;
    }
    if (proposal.executed) {
      setError("This proposal has already been executed.");
      return;
    }
    try {
      const provider = new BrowserProvider(activeWallet.provider, "any");
      const signer = await provider.getSigner();
      const governance = new Contract(CONTRACTS.governance, GOVERNANCE_ABI, signer);
      await sendTransaction("Mark proposal executed", () =>
        governance.execute(proposal.id),
      );
    } catch (executeError) {
      setError(errorMessage(executeError));
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Vistacoin home">
          <span className="brand-mark">V</span><span>VISTACOIN</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link className="nav-link" href="/dashboard">Dashboard</Link>
          <Link className="nav-link" href="/staking">Staking</Link>
          <Link className="nav-link" href="/escrow">Escrow</Link>
          <Link className="nav-link active" href="/governance">Governance</Link>
          <Link className="nav-link" href="/ico">Presale</Link>
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
              {wallets.length > 1 && (
                <select aria-label="Choose wallet" value={selectedWallet} onChange={(event) => setSelectedWallet(Number(event.target.value))} className="wallet-select">
                  {wallets.map((wallet, index) => <option key={`${wallet.name}-${index}`} value={index}>{wallet.name}</option>)}
                </select>
              )}
              <button className="wallet-button" onClick={connectWallet}>{selectedWalletOption ? `Connect ${selectedWalletOption.name}` : "Connect wallet"}</button>
            </div>
          )}
        </div>
      </header>

      <section className="hero governance-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> VSC GOVERNANCE · SEPOLIA</p>
          <h1>Shape the<br /><span>next chapter.</span></h1>
          <p className="hero-description">Create community proposals and vote with your current VSC balance during the voting window.</p>
          <div className="hero-actions">
            {activeWallet && !isSepolia ? (
              <button className="primary-button" onClick={switchToSepolia}>Switch to Sepolia</button>
            ) : !activeWallet ? (
              <button className="primary-button" onClick={connectWallet}>Connect wallet <span aria-hidden="true">↗</span></button>
            ) : (
              <button className="primary-button secondary-action" onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "Refresh proposals"}</button>
            )}
            <a className="text-link" href={`${explorer}/address/${CONTRACTS.governance}`} target="_blank" rel="noreferrer">View governance contract <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="governance-hero-stat">
          <span className="staking-hero-label">YOUR VOTING BALANCE</span>
          <strong>{data && account ? formatTokenAmount(data.tokenBalance) : "—"}<span> VSC</span></strong>
          <span className="staking-hero-foot">{account ? "Voting weight uses current balance" : "Connect wallet to check eligibility"}</span>
        </div>
      </section>

      <div className="escrow-safety-note governance-warning">
        <span className="release-check">!</span>
        <span><strong>Prototype governance.</strong> Votes use each wallet’s current VSC balance, not a historical snapshot. The contract has no quorum or delegation, and execution only marks a proposal executed—it does not carry out external actions.</span>
      </div>

      {error && <div className="notice error-notice" role="alert"><span className="notice-icon">!</span><span>{error}</span><button className="notice-close" onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
      {transaction && (
        <div className={`notice transaction-notice ${transaction.complete ? "success-notice" : ""}`} role="status">
          <span className="notice-icon">{transaction.complete ? "✓" : "…"}</span>
          <span>{transaction.complete ? `${transaction.label} confirmed` : `${transaction.label} submitted`}{transaction.hash && <>{" · "}<a href={`${explorer}/tx/${transaction.hash}`} target="_blank" rel="noreferrer">View transaction</a></>}</span>
          <button className="notice-close" onClick={() => setTransaction(null)} aria-label="Dismiss transaction status">×</button>
        </div>
      )}

      <section className="dashboard-grid governance-dashboard">
        <article className="panel governance-create-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">COMMUNITY INPUT</p><h2>Create a proposal</h2></div>
            <span className="secure-label"><span className="secure-dot" /> ON-CHAIN</span>
          </div>
          {!activeWallet || !account ? (
            <div className="wallet-prompt"><div className="prompt-icon">⌁</div><h3>Connect your wallet</h3><p>A positive VSC balance is required by the contract to create a proposal.</p><button className="primary-button" onClick={connectWallet}>Connect wallet</button></div>
          ) : !isSepolia ? (
            <div className="wallet-prompt"><div className="prompt-icon warning-prompt">!</div><h3>Wrong network</h3><p>Switch to Sepolia to create proposals or vote.</p><button className="primary-button" onClick={switchToSepolia}>Switch to Sepolia</button></div>
          ) : (
            <form className="action-form governance-form" onSubmit={createProposal}>
              <div className="form-title"><span className="form-icon">＋</span><div><h3>New proposal</h3><p>Describe one clear decision for the community.</p></div></div>
              <label htmlFor="proposal-description">Proposal description</label>
              <textarea id="proposal-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={5} placeholder="What should the community decide?" required />
              <div className="textarea-meta">{description.length}/500 characters</div>
              <label htmlFor="proposal-duration">Voting period</label>
              <div className="amount-input governance-duration"><input id="proposal-duration" type="number" min="1" max="365" step="1" value={durationDays} onChange={(event) => setDurationDays(event.target.value)} required /><span>days</span></div>
              <p className="form-hint">{data && data.tokenBalance > BigInt(0) ? `Eligible to propose with ${formatTokenAmount(data.tokenBalance)} VSC.` : "A positive VSC balance is required to create proposals."}</p>
              <button className="submit-button" type="submit" disabled={working || !description.trim() || !data || data.tokenBalance <= BigInt(0)}>{working ? "Waiting for wallet…" : "Create proposal"} <span aria-hidden="true">→</span></button>
            </form>
          )}
        </article>
        <article className="panel governance-rules-panel">
          <div className="panel-heading"><div><p className="eyebrow">HOW THIS DEPLOYMENT WORKS</p><h2>Voting rules</h2></div><span className="panel-symbol">VSC</span></div>
          <div className="detail-list">
            <div className="detail-row"><span>Proposal creation</span><strong>Requires positive VSC balance</strong></div>
            <div className="detail-row"><span>Voting weight</span><strong>Current VSC balance at vote time</strong></div>
            <div className="detail-row"><span>Votes per wallet</span><strong>One vote per proposal</strong></div>
            <div className="detail-row"><span>Pass condition</span><strong>For votes exceed against votes</strong></div>
            <div className="detail-row"><span>Execution</span><strong>Anyone, after voting ends</strong></div>
          </div>
          <div className="release-note"><span className="release-check">i</span><span>“Execute” records the result on-chain; it does not automate treasury or contract changes.</span></div>
        </article>
      </section>

      <section className="panel governance-proposals-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">PROPOSAL HISTORY</p><h2>Community proposals</h2></div>
          <button className="refresh-button" onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
        </div>
        {!isSepolia ? (
          <div className="empty-deals"><p>Switch to Sepolia to view governance proposals.</p><button className="primary-button" onClick={switchToSepolia}>Switch to Sepolia</button></div>
        ) : data?.proposals.length ? (
          <div className="proposal-list">
            {data.proposals.map((proposal) => {
              const active = BigInt(now) < proposal.endTime;
              const canExecute = !active && !proposal.executed && proposal.forVotes > proposal.againstVotes;
              const status = proposalStatus(proposal, now);
              return (
                <article className="proposal-card" key={proposal.id.toString()}>
                  <div className="proposal-card-heading">
                    <span className="deal-id">PROPOSAL #{proposal.id.toString()}</span>
                    <span className={`deal-status ${proposal.executed ? "deal-resolved" : active ? "deal-review" : proposal.forVotes > proposal.againstVotes ? "deal-resolved" : ""}`}><span className="status-dot" />{status}</span>
                  </div>
                  <p className="proposal-description">{proposal.description}</p>
                  <div className="proposal-vote-grid">
                    <div><span>FOR</span><strong>{formatTokenAmount(proposal.forVotes)} VSC</strong></div>
                    <div><span>AGAINST</span><strong>{formatTokenAmount(proposal.againstVotes)} VSC</strong></div>
                    <div><span>VOTING ENDS</span><strong>{formatDate(proposal.endTime)}</strong></div>
                    <div><span>YOUR VOTE</span><strong>{proposal.alreadyVoted ? "Cast" : "Not cast"}</strong></div>
                  </div>
                  {active && (
                    <div className="proposal-actions">
                      {!activeWallet || !account ? (
                        <span className="proposal-action-note">Connect wallet to vote on this proposal.</span>
                      ) : proposal.alreadyVoted ? (
                        <span className="proposal-action-note">This wallet has already voted.</span>
                      ) : data.tokenBalance <= BigInt(0) ? (
                        <span className="proposal-action-note">Positive VSC balance required to vote.</span>
                      ) : (
                        <>
                          <span className="proposal-action-note">Vote weight: {formatTokenAmount(data.tokenBalance)} VSC</span>
                          <button className="submit-button proposal-for" onClick={() => void castVote(proposal, true)} disabled={working}>Vote for</button>
                          <button className="submit-button proposal-against" onClick={() => void castVote(proposal, false)} disabled={working}>Vote against</button>
                        </>
                      )}
                    </div>
                  )}
                  {canExecute && <div className="proposal-actions"><span className="proposal-action-note">Voting ended with more for than against votes.</span>{activeWallet ? <button className="submit-button proposal-for" onClick={() => void executeProposal(proposal)} disabled={working}>Execute result</button> : <button className="submit-button proposal-for" onClick={connectWallet}>Connect to execute</button>}</div>}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-deals"><p>{data ? "No proposals found in the first 100 indexed entries for this deployment." : "Loading public proposal history…"}</p>{!activeWallet && <button className="primary-button" onClick={connectWallet}>Connect wallet</button>}</div>
        )}
      </section>

      <footer className="site-footer"><span>VISTACOIN <span className="footer-muted">· SEPOLIA TESTNET</span></span><span>Experimental token-weighted voting · Verify transactions before signing</span><a href={`${explorer}/address/${CONTRACTS.governance}`} target="_blank" rel="noreferrer">Etherscan ↗</a></footer>
    </main>
  );
}
