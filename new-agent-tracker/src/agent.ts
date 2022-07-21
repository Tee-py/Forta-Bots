import { BigNumber } from "ethers";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

export const CREATE_AGENT_FUNCTION_SIGNATURE = "function createAgent(uint256 agentId, address owner, string metadata, uint256[] chainIds)";
export const NETHERMIND_DEPLOYER_ADDRESS = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";
export const FORTA_DEPLOY_CONTRACT = "0x61447385B019187daa48e91c55c02AF1F1f3F863";

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  const createAgentFunctionCalls = txEvent.filterFunction(CREATE_AGENT_FUNCTION_SIGNATURE, FORTA_DEPLOY_CONTRACT);
  console.log(createAgentFunctionCalls);
  createAgentFunctionCalls.forEach((createAgentCall) => {
    console.log(createAgentCall);
  })
  return findings;
};

// const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
//   const findings: Finding[] = [];
//   // detect some block condition
//   return findings;
// }

export default {
  handleTransaction,
  // handleBlock
};
