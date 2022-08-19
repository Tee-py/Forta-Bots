import { ethers } from "ethers";
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getEthersProvider,
} from "forta-agent";
import {
  ARBITRUM_ESCROW,
  ARBITRUM_RPC_URL,
  L1_DAI,
  L2_DAI,
  OPTIMISM_ESCROW,
  OPTIMISM_RPC_URL,
  TRANSFER_EVENT,
} from "./constants";
import { HandlerArgs } from "./types";
import { cache, createFinding, getBalanceAndTotalSupply } from "./utils";

export function provideHandleTransaction(args: HandlerArgs): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const transferEvents = txEvent.filterLog(TRANSFER_EVENT);
    for (const call of transferEvents) {
      const [source, destination, amount] = call.args;
      if (destination.toString() === args.arbitrumEscrow) {
        const [l1balance, l2totalSupply] = await getBalanceAndTotalSupply(
          args.l1Provider,
          args.arbitrumProvider,
          args.l1Dai,
          args.l2Dai,
          args.arbitrumEscrow,
          args.cache
        );
        if (l1balance.gt(l2totalSupply)) {
          findings.push(
            createFinding({
              source,
              destination,
              amount,
              l1Balance: l1balance.toString(),
              l2TotalSupply: l2totalSupply.toString(),
              chain: "arbitrum",
            })
          );
        }
      }
      if (destination.toString() === args.optimismEscrow) {
        const [l1balance, l2totalSupply] = await getBalanceAndTotalSupply(
          args.l1Provider,
          args.optimismProvider,
          args.l1Dai,
          args.l2Dai,
          args.optimismEscrow,
          args.cache
        );
        if (l1balance.gt(l2totalSupply)) {
          findings.push(
            createFinding({
              source,
              destination,
              amount: amount.toString(),
              l1Balance: l1balance.toString(),
              l2TotalSupply: l2totalSupply.toString(),
              chain: "optimism",
            })
          );
        }
      }
    }
    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction({
    arbitrumProvider: new ethers.providers.JsonRpcProvider(ARBITRUM_RPC_URL),
    optimismProvider: new ethers.providers.JsonRpcProvider(OPTIMISM_RPC_URL),
    l1Provider: getEthersProvider(),
    l1Dai: L1_DAI,
    l2Dai: L2_DAI,
    arbitrumEscrow: ARBITRUM_ESCROW,
    optimismEscrow: OPTIMISM_ESCROW,
    cache: cache,
  }),
};
