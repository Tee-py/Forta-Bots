import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { Interface } from "ethers/lib/utils";
import { FORTA_DEPLOY_CONTRACT, CREATE_AGENT_FUNCTION_SIGNATURE, NETHERMIND_DEPLOYER_ADDRESS } from "./constants";
import { provideTransactionHandler } from "./agent";
import { BigNumber } from "ethers";

const FORTA_INTERFACE = new Interface([CREATE_AGENT_FUNCTION_SIGNATURE]);
const TEST_DATA = {
  agentId: BigNumber.from("98314719185781113719817842660395766469191515480823243882300809349131495172261"),
  owner: "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8",
  metadata: "QmPkydGrmSK2roUJeNzsdC3e7Yetr7zb7UNdmiXyRUM6i7",
  chainIds: [BigNumber.from("43114")],
};

describe("New Forta Agent Deployment Bot", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideTransactionHandler(NETHERMIND_DEPLOYER_ADDRESS, FORTA_DEPLOY_CONTRACT);
  });

  describe("handleTransaction", () => {
    it("returns empty findings if there are no Bot Deployments", async () => {
      const mockTxEvent = new TestTransactionEvent();
      const findings = await handleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
    });

    it("returns a finding when there's a bot deployment from Nethermind To Forta", async () => {
      const mockTxEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(NETHERMIND_DEPLOYER_ADDRESS)
        .setTo(FORTA_DEPLOY_CONTRACT)
        .addTraces({
          to: FORTA_DEPLOY_CONTRACT,
          from: NETHERMIND_DEPLOYER_ADDRESS,
          input: FORTA_INTERFACE.encodeFunctionData("createAgent", [
            TEST_DATA.agentId,
            TEST_DATA.owner,
            TEST_DATA.metadata,
            TEST_DATA.chainIds,
          ]),
        });
      const findings = await handleTransaction(mockTxEvent);
      const findingObject = {
        name: "New agent",
        description: "Bot Deployed By Nethermind",
        alertId: "NETHERMIND-1",
        protocol: "NETHERMIND",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          agentId: TEST_DATA.agentId,
          owner: TEST_DATA.owner,
          metadata: TEST_DATA.metadata,
          chainIds: TEST_DATA.chainIds,
        },
      };
      expect(findings.length).toStrictEqual(1);
      expect(findings[0].metadata).toStrictEqual(findingObject.metadata);
    });

    it("Returns Empty Findings When Deployer Is Not NetherMind", async () => {
      const mockTxEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom("0x435")
        .setTo(FORTA_DEPLOY_CONTRACT)
        .addTraces({
          to: FORTA_DEPLOY_CONTRACT,
          from: "0x435",
          input: FORTA_INTERFACE.encodeFunctionData("createAgent", [
            TEST_DATA.agentId,
            TEST_DATA.owner,
            TEST_DATA.metadata,
            TEST_DATA.chainIds,
          ]),
        });
      const findings = await handleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
    });
  });
});
