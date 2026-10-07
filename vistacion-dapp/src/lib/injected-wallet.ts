export interface InjectedProvider {
  request(args: {
    method: string;
    params?: readonly unknown[] | object;
  }): Promise<unknown>;
  on?(
    event: "accountsChanged" | "chainChanged",
    listener: (value: unknown) => void,
  ): void;
  removeListener?(
    event: "accountsChanged" | "chainChanged",
    listener: (value: unknown) => void,
  ): void;
  providers?: InjectedProvider[];
  isMetaMask?: boolean;
  isRabby?: boolean;
  isCoinbaseWallet?: boolean;
}

export interface InjectedWallet {
  name: string;
  provider: InjectedProvider;
}

declare global {
  interface Window {
    ethereum?: InjectedProvider;
  }
}

function getWalletName(provider: InjectedProvider): string {
  if (provider.isRabby) return "Rabby";
  if (provider.isCoinbaseWallet) return "Coinbase Wallet";
  if (provider.isMetaMask) return "MetaMask";
  return "Injected wallet";
}

export function getInjectedWallets(): InjectedWallet[] {
  if (typeof window === "undefined" || !window.ethereum) return [];

  const providers = window.ethereum.providers?.length
    ? window.ethereum.providers
    : [window.ethereum];
  const seen = new Set<InjectedProvider>();

  return providers.flatMap((provider) => {
    if (seen.has(provider)) return [];
    seen.add(provider);
    return [{ name: getWalletName(provider), provider }];
  });
}
