import { TransactionDescription } from "ethers/lib/utils";
import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

import { CREATE_AGENT_FUNCTION_SIGNATURE, FORTA_DEPLOY_CONTRACT, NETHERMIND_DEPLOYER_ADDRESS } from "./constants";

export function provideTransactionHandler(deployer: string, forta_contract: string): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const createAgentFunctionCalls = txEvent.filterFunction(CREATE_AGENT_FUNCTION_SIGNATURE, forta_contract);
    createAgentFunctionCalls.forEach((call: TransactionDescription) => {
      if (txEvent.from == deployer.toLocaleLowerCase()) {
        const [agentId, owner, metadata, chainIds] = call.args;
        const findingObject = {
          name: "New Bot",
          description: "Bot Deployed By Nethermind",
          alertId: "NETHERMIND-1",
          protocol: "NETHERMIND",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            metadata,
            agentId,
            owner,
            chainIds,
          },
        };
        findings.push(Finding.fromObject(findingObject));
      }
    });
    return findings;
  };
}

export default {
  handleTransaction: provideTransactionHandler(NETHERMIND_DEPLOYER_ADDRESS, FORTA_DEPLOY_CONTRACT),
};
