import { JsonRpcProvider } from "@ethersproject/providers";
import { Finding, getJsonRpcUrl, HandleTransaction, TransactionEvent } from "forta-agent";
import { UNISWAP_V3_POOL_ABI, V3_FACTORY_CONTRACT_ADDRESS } from "./constants";
import { createSwapFinding, createSwapMetaData, isUniSwapPool } from "./utils";
import LRU from "lru-cache";

export function provideTransactionHandler(
  factoryAddress: string,
  provider: JsonRpcProvider,
  cache: LRU<string, boolean>
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const swaps = txEvent.filterLog(UNISWAP_V3_POOL_ABI[0]);
    for (const swapEvent of swaps) {
      const pairAddress = swapEvent["address"];
      let isValidPool;
      try {
        isValidPool = await isUniSwapPool(factoryAddress, pairAddress, cache, provider);
      } catch (error) {
        return [];
      }

      if (isValidPool) {
        const metadata = createSwapMetaData(swapEvent.args, pairAddress);
        findings.push(createSwapFinding(metadata));
      }
    }
    return findings;
  };
}

const provider = new JsonRpcProvider(getJsonRpcUrl());
const uniSwapPoolCache = new LRU<string, boolean>({ max: 500 });

export default {
  handleTransaction: provideTransactionHandler(V3_FACTORY_CONTRACT_ADDRESS, provider, uniSwapPoolCache),
};
