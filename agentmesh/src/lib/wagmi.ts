import { createConfig, http } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { decimals: 18, name: "MON", symbol: "MON" },
  rpcUrls: {
    default: { http: ["https://monad-testnet.drpc.org"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected(), metaMask()],
  transports: {
    [monadTestnet.id]: http("https://monad-testnet.drpc.org"),
  },
  ssr: true,
});
