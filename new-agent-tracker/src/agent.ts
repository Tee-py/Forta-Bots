import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

export const CREATE_AGENT_FUNCTION_SIGNATURE =
  "function createAgent(uint256 agentId, address owner, string metadata, uint256[] chainIds)";
export const NETHERMIND_DEPLOYER_ADDRESS =
  "0x88dc3a2284fa62e0027d6d6b1fcfdd2141a143b8";
export const FORTA_DEPLOY_CONTRACT =
  "0x61447385b019187daa48e91c55c02af1f1f3f863";

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];
  const createAgentFunctionCalls = txEvent.filterFunction(
    CREATE_AGENT_FUNCTION_SIGNATURE,
    FORTA_DEPLOY_CONTRACT
  );
  createAgentFunctionCalls.forEach((createAgentCall) => {
    if (
      txEvent.to == FORTA_DEPLOY_CONTRACT &&
      txEvent.from == NETHERMIND_DEPLOYER_ADDRESS
    ) {
      const [, , metadata] = createAgentCall.args;
      const findingObject = {
        name: "New agent",
        description: "Bot Deployed By Nethermind",
        alertId: "NETHERMIND-1",
        protocol: "NETHERMIND",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          metadata,
        },
      };
      findings.push(Finding.fromObject(findingObject));
    }
  });
  return findings;
};

export default {
  handleTransaction,
};
