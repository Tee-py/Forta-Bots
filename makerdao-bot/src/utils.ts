import { BigNumber, ethers } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";
import LRU from "lru-cache";
import { DAI_ABI } from "./constants";
import { MetaData, Provider } from "./types";

export const cache = new LRU<string, BigNumber>({ max: 500 });

export const getBalanceAndTotalSupply = async (
  l1Provider: Provider,
  l2Provider: Provider,
  l1Dai: string,
  l2Dai: string,
  l1Escrow: string,
  cache: LRU<string, BigNumber>
): Promise<BigNumber[]> => {
  const L1DAI = new ethers.Contract(l1Dai, DAI_ABI, l1Provider);
  const L2DAI = new ethers.Contract(l2Dai, DAI_ABI, l2Provider);
  const [l1Block, l2Block] = await Promise.all([l1Provider.getBlockNumber(), l2Provider.getBlockNumber()]);
  let l1Balance: BigNumber;
  let l2TotalSupply: BigNumber;
  const l1CacheKey = `${l1Dai}-${l1Block}`;
  const l2CacheKey = `${l2Dai}-${l2Block}`;
  if (cache.has(l1CacheKey)) {
    l1Balance = cache.get(l1CacheKey) as BigNumber;
  } else {
    l1Balance = await L1DAI.balanceOf(l1Escrow, { blockTag: l1Block });
    cache.set(l1CacheKey, l1Balance);
  }

  if (cache.has(l2CacheKey)) {
    l2TotalSupply = cache.get(l2CacheKey) as BigNumber;
  } else {
    l2TotalSupply = await L2DAI.totalSupply({ blockTag: l2Block });
    cache.set(l2CacheKey, l2TotalSupply);
  }
  return [l1Balance, l2TotalSupply];
};

export const createFinding = (metadata: MetaData): Finding => {
  return Finding.fromObject({
    name: `Invariant violation on MakerDAO ${metadata.chain} DAI Bridge`,
    description: `Total supply of DAI tokens on ${metadata.chain} now exceeds the balance of MakerDao ${metadata.chain} L1 escrow.`,
    alertId: metadata.chain == "optimism" ? "OPT-INV" : "ARB-INV",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    protocol: "MakerDao",
    metadata,
  });
};
