import { TransactionDescription } from "ethers/lib/utils";
import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createFinding } from "./utils";

import { CREATE_AGENT_FUNCTION_SIGNATURE, FORTA_DEPLOY_CONTRACT, NETHERMIND_DEPLOYER_ADDRESS } from "./constants";

export function provideTransactionHandler(deployer: string, forta_contract: string): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    if (txEvent.from != deployer.toLowerCase()) {
      return findings;
    }
    const createAgentFunctionCalls = txEvent.filterFunction(CREATE_AGENT_FUNCTION_SIGNATURE, forta_contract);
    createAgentFunctionCalls.forEach((call: TransactionDescription) => {
      const [agentId, owner, metadata, chainIds] = call.args;
      findings.push(createFinding(agentId, metadata, chainIds, owner, "NETHERMIND-1"));
    });
    return findings;
  };
}

export default {
  handleTransaction: provideTransactionHandler(NETHERMIND_DEPLOYER_ADDRESS, FORTA_DEPLOY_CONTRACT),
};
