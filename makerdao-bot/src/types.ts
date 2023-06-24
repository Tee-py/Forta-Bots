import { BigNumber, ethers } from "ethers";
import LRU from "lru-cache";

export type Provider = ethers.providers.JsonRpcProvider;
export type HandlerArgs = {
  provider: Provider;
  l1Dai: string;
  l2Dai: string;
  arbitrumEscrow: string;
  optimismEscrow: string;
  arbitrumL1Gateway: string;
  L2Bridge: string;
  arbitrumBotId: string;
  optimismBotId: string;
  arbitrumChainId: number;
  optimismChainId: number;
  cache: LRU<string, BigNumber>;
};

export type L2MetaData = {
  destination: string;
  amount: string;
  totalSupply: string;
  chainId: string;
  chain: string;
};

export type ViolationMetaData = {
  balance: string;
  totalSupply: string;
  chain: string;
};
