import { Result } from "ethers/lib/utils";
import { ethers } from "ethers";
import { UNISWAP_V3_POOL_ABI } from "./constants";
import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { computePoolAddress, FeeAmount } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";
import LRU from "lru-cache";

type MetaData = {
  [key: string]: string;
};

export const createSwapFinding = (metadata: MetaData): Finding => {
  return Finding.fromObject({
    name: "New UniswapV3 swap",
    description: `New Swap detected from UNISWAP-V3 POOL ${metadata.poolAddress}`,
    alertId: "V3-SWAP",
    protocol: "NETHERMIND",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata,
  });
};

export const createSwapMetaData = (eventArgs: Result, poolAddress: string): MetaData => {
  const [sender, recipient, amount0, amount1, , ,] = eventArgs;
  return { poolAddress, sender, recipient, amountIn: amount0.abs().toString(), amountOut: amount1.abs().toString() };
};

export const feeToFeeAmount = (fee: string): FeeAmount => {
  if (fee === "100") return FeeAmount.LOWEST;
  if (fee === "500") return FeeAmount.LOW;
  if (fee === "3000") return FeeAmount.MEDIUM;
  if (fee === "10000") return FeeAmount.HIGH;
  return FeeAmount.LOW;
};

export const isUniSwapPool = async (
  factoryAddress: string,
  pairAddress: string,
  poolCache: LRU<string, boolean>,
  provider: ethers.providers.JsonRpcProvider
): Promise<boolean> => {
  // checks if pairAddress exists in uniswap Pool cache
  if (poolCache.has(pairAddress)) return poolCache.get(pairAddress) as Promise<boolean>;
  // Gets the pool info e.g (token0, token1, fee) from the pool contract
  const poolContract = new ethers.Contract(pairAddress, UNISWAP_V3_POOL_ABI, provider);
  const [token0, token1, fee] = await Promise.all([poolContract.token0(), poolContract.token1(), poolContract.fee()]);
  let tokenA = new Token(1234, token0, 18);
  let tokenB = new Token(1234, token1, 18);
  let feeAmount = feeToFeeAmount(fee.toString());
  // calculates the pair address using create2 and compares the calculated address with the pairAddress
  const poolAddress = await computePoolAddress({ factoryAddress, tokenA, tokenB, fee: feeAmount });
  const result = poolAddress.toLowerCase() === pairAddress.toLowerCase();
  poolCache.set(pairAddress, result); // updates the pool cache with the result of the computation
  return result;
};
