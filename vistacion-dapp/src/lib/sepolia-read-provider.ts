import { JsonRpcProvider } from "ethers";
import { NETWORKS, SEPOLIA_CHAIN_ID } from "@/src/config/networks";

const sepoliaReadProvider = new JsonRpcProvider(
  NETWORKS.sepolia.rpcUrls[0],
  SEPOLIA_CHAIN_ID,
);

export function getSepoliaReadProvider(): JsonRpcProvider {
  return sepoliaReadProvider;
}
