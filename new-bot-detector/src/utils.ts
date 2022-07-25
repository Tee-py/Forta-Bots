import { BigNumber } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (
  agentId: BigNumber,
  metadata: string,
  chainIds: BigNumber[],
  owner: string,
  alertId: string
) => {
  return Finding.fromObject({
    name: "New Bot",
    description: "Bot Deployed By Nethermind",
    alertId: alertId,
    protocol: "NETHERMIND",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      metadata,
      agentId: agentId.toString(),
      owner,
      chainIds: chainIds.toString(),
    },
  });
};
