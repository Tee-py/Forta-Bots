import { defaultAbiCoder, getCreate2Address, Result, solidityKeccak256 } from "ethers/lib/utils";
import { BigNumber, ethers } from "ethers";
import { INIT_CODE_HASH, UNISWAP_V3_POOL_ABI } from "./constants";
import { Finding, FindingSeverity, FindingType } from "forta-agent";
import LRU from "lru-cache";

type MetaData = {
  [key: string]: string;
};

export const uniSwapPoolCache = new LRU<string, boolean>({ max: 500 });

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

export const computePoolAddress = (factoryAddress: string, tokenA: string, tokenB: string, fee: string): string => {
  const [token0, token1] = tokenA > tokenB ? [tokenB, tokenA] : [tokenA, tokenB];
  const encoded_byte = defaultAbiCoder.encode(["address", "address", "uint24"], [token0, token1, fee]);
  const salt = solidityKeccak256(["bytes"], [encoded_byte]);
  const address = getCreate2Address(factoryAddress, salt, INIT_CODE_HASH);
  return address;
};

export const isUniSwapPool = async (
  factoryAddress: string,
  pairAddress: string,
  poolCache: LRU<string, boolean>,
  provider: ethers.providers.Provider
): Promise<boolean> => {
  // checks if pairAddress exists in uniswap Pool cache
  if (poolCache.has(pairAddress)) return poolCache.get(pairAddress) as Promise<boolean>;
  // Gets the pool info e.g (token0, token1, fee) from the pool contract
  const poolContract = new ethers.Contract(pairAddress, UNISWAP_V3_POOL_ABI, provider);
  console.log(`Got Here --> ${pairAddress}`)
  const [token0, token1, fee] = await Promise.all([poolContract.token0(), poolContract.token1(), poolContract.fee()]);
  console.log("After")
  // calculates the pair address using create2 and compares the calculated address with the pairAddress
  const poolAddress = computePoolAddress(factoryAddress, token0, token1, fee.toString());
  const result = poolAddress.toLowerCase() === pairAddress.toLowerCase();
  poolCache.set(pairAddress, result); // updates the pool cache with the result of the computation
  return result;
};
