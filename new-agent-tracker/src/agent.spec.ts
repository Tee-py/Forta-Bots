import { BigNumber } from "ethers";
import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
  TransactionEvent,
} from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests";
import agent, {
  FORTA_DEPLOY_CONTRACT,
  CREATE_AGENT_FUNCTION_SIGNATURE,
  NETHERMIND_DEPLOYER_ADDRESS,
} from "./agent";

const TEST_TX_DATA =
  "0x7935d5b4d95c28bb11ef69b285bfdc96a12024f64f98c1440262383d57977424117a68a500000000000000000000000088dc3a2284fa62e0027d6d6b1fcfdd2141a143b8000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000002e516d506b796447726d534b32726f554a654e7a73644333653759657472377a6237554e646d69587952554d3669370000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000a86a";

describe("New Forta Agent Deployment Bot", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("returns empty findings if there are no Bot Deployments", async () => {
      const mockTxEvent = new TestTransactionEvent();
      mockTxEvent.filterFunction = jest.fn().mockReturnValue([]);
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledWith(
        CREATE_AGENT_FUNCTION_SIGNATURE,
        FORTA_DEPLOY_CONTRACT
      );
    });

    it("returns a finding when there's a bot deployment from Nethermind To Forta", async () => {
      const mockTxEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom(NETHERMIND_DEPLOYER_ADDRESS)
        .setTo(FORTA_DEPLOY_CONTRACT)
        .setData(TEST_TX_DATA);
      const findings = await handleTransaction(mockTxEvent);
      const findingObject = {
        name: "New agent",
        description: "Bot Deployed By Nethermind",
        alertId: "NETHERMIND-1",
        protocol: "NETHERMIND",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          metadata: "QmPkydGrmSK2roUJeNzsdC3e7Yetr7zb7UNdmiXyRUM6i7",
        },
      };
      expect(findings).toStrictEqual([Finding.fromObject(findingObject)]);
    });

    it("Returns Empty Findings When Deployer Is Not NetherMind", async () => {
      const mockTxEvent: TransactionEvent = new TestTransactionEvent()
        .setFrom("0x435")
        .setTo("0x3456");
      mockTxEvent.filterFunction = jest.fn().mockReturnValue([]);
      const findings = await handleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledWith(
        CREATE_AGENT_FUNCTION_SIGNATURE,
        FORTA_DEPLOY_CONTRACT
      );
    });
  });
});
