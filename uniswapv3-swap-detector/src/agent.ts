import { JsonRpcProvider } from "@ethersproject/providers";
import {
  ethers,
  Finding,
  getJsonRpcUrl,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { SWAP_EVENT, V3_FACTORY_CONTRACT_ADDRESS, POOL_ABI } from "./constants";
import { createSwapFinding, createSwapMetaData, feeToFeeAmount, isUniSwapPool } from "./utils";

export function provideTransactionHandler(factoryAddress: string, provider: JsonRpcProvider): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const swaps = txEvent.filterLog(SWAP_EVENT);
    for (const swapEvent of swaps) {
      const poolAddress = swapEvent["address"];
      const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
      const [token0, token1, fee] = await Promise.all([poolContract.token0(), poolContract.token1(), poolContract.fee()]);
      const isValidPool = await isUniSwapPool(factoryAddress, poolAddress, token0, token1, feeToFeeAmount(fee.toString()));
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
