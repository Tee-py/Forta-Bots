import { BigNumber, ethers } from "ethers";
import LRU from "lru-cache";

export type Provider = ethers.providers.JsonRpcProvider;
export type HandlerArgs = {
  arbitrumProvider: Provider;
  optimismProvider: Provider;
  l1Provider: Provider;
  l1Dai: string;
  l2Dai: string;
  arbitrumEscrow: string;
  optimismEscrow: string;
  cache: LRU<string, BigNumber>;
};

export type MetaData = {
  source: string;
  destination: string;
  amount: string;
  l1Balance: string;
  l2TotalSupply: string;
  chain: string;
};
