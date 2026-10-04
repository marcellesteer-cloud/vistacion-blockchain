"use client";
 
import Link from "next/link";
import { useState } from "react";
import { ethers } from "ethers";
import tokenAbi from "../../artifacts/contracts/VistacionToken.sol/VistacionToken.json";
export default function Home() {
const [account, setAccount] = useState("");
const [walletBalance, setWalletBalance] = useState("0.00 ETH");
const [tokenBalance, setTokenBalance] = useState("0 VSC");
 
const tokenAddress =
"0x587922d204AA80E44097FedF22563E54Aa51397a";
 
async function connectWallet() {
try {
const ethereum = (window as any).ethereum;
 
const accounts = await ethereum.request({
method: "eth_requestAccounts",
});
 
setAccount(accounts[0]);
 
const provider = new ethers.BrowserProvider(ethereum);
 
const balance = await provider.getBalance(accounts[0]);
 
setWalletBalance(
ethers.formatEther(balance) + " ETH"
);
 
const signer = await provider.getSigner();
 
const token = new ethers.Contract(
tokenAddress,
(tokenAbi as any).abi,
signer
);
 
const vscBalance = await token.balanceOf(accounts[0]);
 
setTokenBalance(
Number(
ethers.formatUnits(vscBalance, 18)
).toLocaleString(undefined, {
maximumFractionDigits: 2,
}) + " VSC"
);
} catch (error: any) {
alert(error.message);
}
}
 
return (
    <>
        <main style={{ padding: "20px" }}>
            <h1>vistacoin Blockchain</h1>
            <h2>VSC Dashboard</h2>

            <button onClick={connectWallet}>Connect MetaMask</button>

            <div style={{ marginTop: "20px" }}>
                <strong>Connected Wallet:</strong>
                <p>{account}</p>

                <strong>Wallet Balance:</strong>
                <p>{walletBalance}</p>

                <strong>VSC Balance:</strong>
                <p>{tokenBalance}</p>
            </div>

            <div style={{ marginTop: "30px" }}>
                <h3>vistacoin Services</h3>

                <ul>
                    <li>
                        <Link href="/staking">Staking</Link>
                    </li>

                    <li>
                        <Link href="/governance">Governance</Link>
                    </li>

                    <li>
                        <Link href="/ico">ICO</Link>
                    </li>

                    <li>
                        <Link href="/escrow">Escrow</Link>
                    </li>
                </ul>
            </div>
        </main>
    </>
);
}