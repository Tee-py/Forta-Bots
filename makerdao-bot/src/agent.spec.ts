import { Provider } from "./types";
import { HandleTransaction } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { BigNumber, utils } from "ethers";
import LRU from "lru-cache";
import {
  ARBITRUM_CHAIN_ID,
  ARBITRUM_ESCROW,
  ARBITRUM_L1_GATEWAY,
  ARBITRUM_L2_DEPOSIT_EVENT,
  DAI_ABI,
  L1_DAI,
  L2_BRIDGE,
  L2_DAI,
  OPTIMISM_CHAIN_ID,
  OPTIMISM_ESCROW,
  OPTIMISM_L2_DEPOSIT_EVENT,
} from "./constants";
import { createTotalSupplyFinding } from "./utils";

describe("Arbitrum-Optimism Bridge Monitor Test", () => {
  let arbitrumHandleTransaction: HandleTransaction;
  let optimismHandleTransaction: HandleTransaction;
  let L1HandleTransaction: HandleTransaction;
  let arbitrumMockProvider: MockEthersProvider;
  let optimismMockProvider: MockEthersProvider;
  let IDAI: utils.Interface;
  let arbitrumProvider: Provider;
  let optimismProvider: Provider;
  let cache: LRU<string, BigNumber>;

  const setProviderBlock = (block: number, provider: MockEthersProvider) => {
    provider.setLatestBlock(block);
  };
  const setL1Balance = (
    l1DAI: string,
    l1Escrow: string,
    balance: BigNumber,
    block: number,
    provider: MockEthersProvider
  ) => {
    provider.addCallTo(l1DAI, block, IDAI, "balanceOf", { inputs: [l1Escrow], outputs: [balance] });
  };

  const setL2TotalSupply = (l2DAI: string, totalSupply: BigNumber, block: number, provider: MockEthersProvider) => {
    provider.addCallTo(l2DAI, block, IDAI, "totalSupply", { inputs: [], outputs: [totalSupply] });
  };

  beforeAll(() => {
    IDAI = new utils.Interface(DAI_ABI);
    arbitrumMockProvider = new MockEthersProvider();
    optimismMockProvider = new MockEthersProvider();
    arbitrumMockProvider.setNetwork(ARBITRUM_CHAIN_ID);
    optimismMockProvider.setNetwork(OPTIMISM_CHAIN_ID);

    arbitrumProvider = arbitrumMockProvider as unknown as Provider;
    optimismProvider = optimismMockProvider as unknown as Provider;
    cache = new LRU<string, BigNumber>({ max: 500 });
    arbitrumHandleTransaction = provideHandleTransaction({
      provider: arbitrumProvider,
      l1Dai: L1_DAI,
      l2Dai: L2_DAI,
      arbitrumEscrow: ARBITRUM_ESCROW,
      optimismEscrow: OPTIMISM_ESCROW,
      arbitrumL1Gateway: ARBITRUM_L1_GATEWAY,
      L2Bridge: L2_BRIDGE,
      arbitrumBotId: "test",
      optimismBotId: "test",
      arbitrumChainId: ARBITRUM_CHAIN_ID,
      optimismChainId: OPTIMISM_CHAIN_ID,
      cache: cache,
    });
    optimismHandleTransaction = provideHandleTransaction({
      provider: optimismProvider,
      l1Dai: L1_DAI,
      l2Dai: L2_DAI,
      arbitrumEscrow: ARBITRUM_ESCROW,
      optimismEscrow: OPTIMISM_ESCROW,
      arbitrumL1Gateway: ARBITRUM_L1_GATEWAY,
      L2Bridge: L2_BRIDGE,
      arbitrumBotId: "test",
      optimismBotId: "test",
      arbitrumChainId: ARBITRUM_CHAIN_ID,
      optimismChainId: OPTIMISM_CHAIN_ID,
      cache: cache,
    });
  });
  describe("Arbitrum Handler Testing", () => {
    it("returns empty findings if there are no Deposits to Arbitrum L2 Bridge", async () => {
      const mockTxEvent = new TestTransactionEvent();
      const findings = await arbitrumHandleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
      expect(arbitrumMockProvider.call).toBeCalledTimes(0);
    });
    it("Returns empty findings for other events", async () => {
      const mockTxEvent = new TestTransactionEvent().addEventLog("event Test(address hii)", createAddress("0x345"), [
        createAddress("0x342"),
      ]);
      const findings = await arbitrumHandleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
      expect(arbitrumMockProvider.call).toBeCalledTimes(0);
    });
    it("Returns empty findings for events from other contracts", async () => {
      const mockTxEvent = new TestTransactionEvent()
        .setBlock(2)
        .addEventLog(ARBITRUM_L2_DEPOSIT_EVENT, createAddress("0x8978"), [
          createAddress("0x456"),
          createAddress("0x345"),
          createAddress("0x345"),
          BigNumber.from("234566666"),
        ]);
      const findings = await arbitrumHandleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
      expect(arbitrumMockProvider.call).toBeCalledTimes(0);
    });

    it("Returns a total supply finding", async () => {
      setL2TotalSupply(L2_DAI, BigNumber.from("45000"), 2, arbitrumMockProvider);
      setProviderBlock(2, arbitrumMockProvider);
      const mockTxEvent = new TestTransactionEvent()
        .setBlock(2)
        .addEventLog(ARBITRUM_L2_DEPOSIT_EVENT, L2_BRIDGE, [
          createAddress("0x456"),
          createAddress("0x345"),
          createAddress("0x345"),
          BigNumber.from("234566666"),
        ]);
      const findings = await arbitrumHandleTransaction(mockTxEvent);
      const expectedFinding = createTotalSupplyFinding({
        destination: createAddress("0x345"),
        amount: "234566666",
        totalSupply: "45000",
        chainId: ARBITRUM_CHAIN_ID.toString(),
        chain: "arbitrum",
      });
      expect(findings).toStrictEqual([expectedFinding]);
      expect(arbitrumMockProvider.call).toBeCalledTimes(1);
      expect(cache.has(`${L2_DAI}-2`)).toStrictEqual(true);
      expect(cache.get(`${L2_DAI}-2`)).toStrictEqual(BigNumber.from("45000"));
    });
  });
  describe("Optimism Handler Testing", () => {
    it("returns empty findings if there are no Deposits to Optimism L2 Bridge", async () => {
      const mockTxEvent = new TestTransactionEvent();
      const findings = await optimismHandleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
      expect(optimismMockProvider.call).toBeCalledTimes(0);
    });
    it("Returns empty findings for other events", async () => {
      const mockTxEvent = new TestTransactionEvent().addEventLog("event Test(address hii)", createAddress("0x345"), [
        createAddress("0x342"),
      ]);
      const findings = await optimismHandleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
      expect(optimismMockProvider.call).toBeCalledTimes(0);
    });
    it("Returns empty findings for events from other contracts", async () => {
      const mockTxEvent = new TestTransactionEvent()
        .setBlock(2)
        .addEventLog(OPTIMISM_L2_DEPOSIT_EVENT, createAddress("0x8978"), [
          createAddress("0x456"),
          createAddress("0x567"),
          createAddress("0x345"),
          createAddress("0x345"),
          BigNumber.from("234566666"),
          "0x0000000000000000000000000000000000000000000000086dcc927deb7da1a7",
        ]);
      const findings = await optimismHandleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
      expect(optimismMockProvider.call).toBeCalledTimes(0);
    });

    it("Returns a total supply finding", async () => {
      setL2TotalSupply(L2_DAI, BigNumber.from("45000"), 2, optimismMockProvider);
      setProviderBlock(2, optimismMockProvider);
      const mockTxEvent = new TestTransactionEvent()
        .setBlock(2)
        .addEventLog(OPTIMISM_L2_DEPOSIT_EVENT, L2_BRIDGE, [
          createAddress("0x456"),
          createAddress("0x567"),
          createAddress("0x345"),
          createAddress("0x345"),
          BigNumber.from("234566666"),
          "0x0000000000000000000000000000000000000000000000086dcc927deb7da1a7",
        ]);
      const findings = await optimismHandleTransaction(mockTxEvent);
      const expectedFinding = createTotalSupplyFinding({
        destination: createAddress("0x345"),
        amount: "234566666",
        totalSupply: "45000",
        chainId: OPTIMISM_CHAIN_ID.toString(),
        chain: "optimism",
      });
      expect(findings).toStrictEqual([expectedFinding]);
      expect(arbitrumMockProvider.call).toBeCalledTimes(1);
      expect(cache.has(`${L2_DAI}-2`)).toStrictEqual(true);
      expect(cache.get(`${L2_DAI}-2`)).toStrictEqual(BigNumber.from("45000"));
    });
  });
});
