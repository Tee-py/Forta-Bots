import { BigNumber } from "ethers";
import { Finding, HandleTransaction, TransactionEvent, getEthersProvider, getAlerts } from "forta-agent";
import {
  L1_DAI,
  L2_DAI,
  TRANSFER_EVENT,
  ARBITRUM_L1_GATEWAY,
  ARBITRUM_ALERT_ID,
  OPTIMISM_ALERT_ID,
  ARBITRUM_ESCROW,
  OPTIMISM_ESCROW,
  ARBITRUM_L2_DEPOSIT_EVENT,
  OPTIMISM_L2_DEPOSIT_EVENT,
  L2_BRIDGE,
} from "./constants";
import { HandlerArgs } from "./types";
import {
  cache,
  getBalance,
  getTotalSupply,
  getNetworkFromChainID,
  createTotalSupplyFinding,
  createInvariantViolationFinding,
} from "./utils";

export function provideHandleTransaction(args: HandlerArgs): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const { chainId } = await args.provider.getNetwork();
    const depositEvents =
      chainId === 10 ? txEvent.filterLog(OPTIMISM_L2_DEPOSIT_EVENT) : txEvent.filterLog(ARBITRUM_L2_DEPOSIT_EVENT);
    const transferEvents = txEvent.filterLog(TRANSFER_EVENT);
    if (chainId !== 1) {
      for (const event of depositEvents) {
        if (event.address !== args.L2Bridge) {
          continue;
        }
        let to;
        let amount;
        if (chainId === args.optimismChainId) {
          [, , , to, amount] = event.args;
        } else {
          [, , to, amount] = event.args;
        }
        const totalSupply = await getTotalSupply(args.provider, args.l2Dai, args.cache);
        const metaData = {
          amount: amount.toString(),
          destination: to,
          chain: getNetworkFromChainID(chainId),
          chainId: chainId.toString(),
          totalSupply: totalSupply.toString(),
        };
        findings.push(createTotalSupplyFinding(metaData));
      }
    }
    if (chainId === 1) {
      if (txEvent.to === args.arbitrumL1Gateway) {
        const { alerts } = await getAlerts({
          botIds: [args.arbitrumBotId],
          alertId: ARBITRUM_ALERT_ID,
          chainId: args.arbitrumChainId,
          first: 1,
        });
        for (const event of transferEvents) {
          if (alerts) {
            const totalSupply = BigNumber.from(alerts[0].metadata.totalSupply);
            const balance = await getBalance(args.provider, args.l1Dai, args.arbitrumEscrow, args.cache);
            if (balance.lt(totalSupply)) {
              findings.push(
                createInvariantViolationFinding({
                  totalSupply: totalSupply.toString(),
                  balance: balance.toString(),
                  chain: getNetworkFromChainID(chainId),
                })
              );
            }
          }
        }
      }
      if (txEvent.to === args.optimismEscrow) {
        const { alerts } = await getAlerts({
          botIds: [args.optimismBotId],
          alertId: OPTIMISM_ALERT_ID,
          chainId: args.optimismChainId,
          first: 1,
        });
        for (const event of transferEvents) {
          if (alerts) {
            const totalSupply = BigNumber.from(alerts[0].metadata.totalSupply);
            const balance = await getBalance(args.provider, args.l1Dai, args.optimismEscrow, args.cache);
            if (balance.lt(totalSupply)) {
              findings.push(
                createInvariantViolationFinding({
                  totalSupply: totalSupply.toString(),
                  balance: balance.toString(),
                  chain: getNetworkFromChainID(chainId),
                })
              );
            }
          }
        }
      }
    }
    return findings;
  };
}
export default {
  handleTransaction: provideHandleTransaction({
    provider: getEthersProvider(),
    arbitrumEscrow: ARBITRUM_ESCROW,
    optimismEscrow: OPTIMISM_ESCROW,
    arbitrumL1Gateway: ARBITRUM_L1_GATEWAY,
    L2Bridge: L2_BRIDGE,
    l1Dai: L1_DAI,
    l2Dai: L2_DAI,
    arbitrumBotId: "test",
    optimismBotId: "test",
    arbitrumChainId: 42161,
    optimismChainId: 10,
    cache: cache,
  }),
};
