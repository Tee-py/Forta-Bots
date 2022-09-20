import { BigNumber, ethers } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";
import LRU from "lru-cache";
import { ARBITRUM_ALERT_ID, DAI_ABI, OPTIMISM_ALERT_ID } from "./constants";
import { L2MetaData, Provider, ViolationMetaData } from "./types";

export const cache = new LRU<string, BigNumber>({ max: 500 });

export const getNetworkFromChainID = (chainID: number): string => {
  if (chainID === 10) return "optimism";
  if (chainID === 42161) return "arbitrum";
  return "ethereum";
};

export const getTotalSupply = async (
  provider: Provider,
  l2Dai: string,
  cache: LRU<string, BigNumber>
): Promise<BigNumber> => {
  const L2DAI = new ethers.Contract(l2Dai, DAI_ABI, provider);
  const blockNumber = await provider.getBlockNumber();
  const cacheKey = `${l2Dai}-${blockNumber}`;
  let totalSupply: BigNumber;
  if (cache.has(cacheKey)) {
    totalSupply = cache.get(cacheKey) as BigNumber;
  } else {
    totalSupply = await L2DAI.totalSupply({ blockTag: blockNumber });
    cache.set(cacheKey, totalSupply);
  }
  return totalSupply;
};
export const getBalance = async (
  provider: Provider,
  l1Dai: string,
  l1Escrow: string,
  cache: LRU<string, BigNumber>
): Promise<BigNumber> => {
  const L1DAI = new ethers.Contract(l1Dai, DAI_ABI, provider);
  const blockNumber = await provider.getBlockNumber();
  let balance: BigNumber;
  const cacheKey = `${l1Dai}-${blockNumber}`;
  if (cache.has(cacheKey)) {
    balance = cache.get(cacheKey) as BigNumber;
  } else {
    balance = await L1DAI.balanceOf(l1Escrow, { blockTag: blockNumber });
    cache.set(cacheKey, balance);
  }
  return balance;
};

export const createInvariantViolationFinding = (metadata: ViolationMetaData): Finding => {
  return Finding.fromObject({
    name: `Invariant Violation ${metadata.chain} DAI Bridge`,
    description: `Total supply of DAI tokens on ${metadata.chain} now exceeds the balance of MakerDao ${metadata.chain} L1 escrow.`,
    alertId: metadata.chain == "optimism" ? "OPTIMISM-INVARIANT-VIOLATION" : "ARBITRUM-INVARIANT-VIOLATION",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    protocol: "MakerDao",
    metadata,
  });
};

export const createTotalSupplyFinding = (metadata: L2MetaData): Finding => {
  return Finding.fromObject({
    name: `New deposit to ${metadata.chain} bridge`,
    description: `There is a new DAI deposit to ${metadata.chain} DAI bridge.`,
    alertId: metadata.chain == "optimism" ? OPTIMISM_ALERT_ID : ARBITRUM_ALERT_ID,
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "MakerDao",
    metadata,
  });
};
