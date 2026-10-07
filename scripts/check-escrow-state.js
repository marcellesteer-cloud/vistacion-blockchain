const allowance = await token.allowance(
wallet.address,
addresses.escrow
);
 
console.log(
"Allowance after approval:",
hre.ethers.formatEther(allowance)
);
 
console.log("Wallet:", wallet.address);
console.log("Balance:", hre.ethers.formatEther(balance));
console.log("Allowance:", hre.ethers.formatEther(allowance));
console.log("Escrow:", addresses.escrow);