export const SEPOLIA_CHAIN_ID = 11_155_111;

export const NETWORKS = {
  sepolia: {
    chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
    chainName: "Sepolia",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
} as const;
