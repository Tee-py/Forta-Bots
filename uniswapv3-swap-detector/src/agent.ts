import { JsonRpcProvider } from "@ethersproject/providers";
import {
  Finding,
  getJsonRpcUrl,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { SWAP_EVENT, V3_FACTORY_CONTRACT_ADDRESS } from "./constants";
import { createSwapFinding, createSwapMetaData, isUniSwapPool } from "./utils";
import LRU from "lru-cache";

export function provideTransactionHandler(factoryAddress: string, provider: JsonRpcProvider): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const swaps = txEvent.filterLog(SWAP_EVENT);
    const uniSwapPoolCache = new LRU<string, boolean>({ max: 500 });
    for (const swapEvent of swaps) {
      const pairAddress = swapEvent["address"];
      const isValidPool = await isUniSwapPool(factoryAddress, pairAddress, uniSwapPoolCache, provider);
      if (isValidPool){
        const metadata = createSwapMetaData(swapEvent.args);
        findings.push(createSwapFinding(metadata));
      }
    }
    return findings
  }
}

export default {
  handleTransaction: provideTransactionHandler(V3_FACTORY_CONTRACT_ADDRESS, new JsonRpcProvider(getJsonRpcUrl())),
};
