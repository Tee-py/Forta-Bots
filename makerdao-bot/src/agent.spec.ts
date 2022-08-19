import { Provider } from "./types";
import { HandleTransaction } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { BigNumber, utils } from "ethers";
import LRU from "lru-cache";
import { ARBITRUM_ESCROW, DAI_ABI, L1_DAI, L2_DAI, OPTIMISM_ESCROW, TRANSFER_EVENT } from "./constants";
import { createFinding } from "./utils";

describe("high tether transfer agent", () => {
  let handleTransaction: HandleTransaction;
  let mockProvider: MockEthersProvider;
  let IDAI: utils.Interface;
  let provider: Provider;
  let cache: LRU<string, BigNumber>;

  const setProviderBlock = (block: number) => {
    mockProvider.setLatestBlock(block);
  };
  const setL1Balance = (l1DAI: string, l1Escrow: string, balance: BigNumber, block: number) => {
    mockProvider.addCallTo(l1DAI, block, IDAI, "balanceOf", { inputs: [l1Escrow], outputs: [balance] });
  };

  const setL2TotalSupply = (l2DAI: string, totalSupply: BigNumber, block: number) => {
    mockProvider.addCallTo(l2DAI, block, IDAI, "totalSupply", { inputs: [], outputs: [totalSupply] });
  };

  beforeAll(() => {
    IDAI = new utils.Interface(DAI_ABI);
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as Provider;
    cache = new LRU<string, BigNumber>({ max: 500 });
    handleTransaction = provideHandleTransaction({
      arbitrumProvider: provider,
      optimismProvider: provider,
      l1Provider: provider,
      l1Dai: L1_DAI,
      l2Dai: L2_DAI,
      arbitrumEscrow: ARBITRUM_ESCROW,
      optimismEscrow: OPTIMISM_ESCROW,
      cache: cache,
    });
  });

  it("returns empty findings if there are no Transfers to the L1 Escrow", async () => {
    const mockTxEvent = new TestTransactionEvent();
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
    expect(mockProvider.call).toBeCalledTimes(0);
  });

  it("Returns empty findings for transfers to other addresses", async () => {
    const mockTxEvent = new TestTransactionEvent().addEventLog(TRANSFER_EVENT, createAddress("0x345"), [
      createAddress("0x342"),
      createAddress("0x234"),
      BigNumber.from("5678"),
    ]);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
    expect(mockProvider.call).toBeCalledTimes(0);
  });

  it("Returns empty findings for other events", async () => {
    const mockTxEvent = new TestTransactionEvent().addEventLog("event Test(address hii)", createAddress("0x345"), [
      createAddress("0x342"),
    ]);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
    expect(mockProvider.call).toBeCalledTimes(0);
  });

  it("Returns empty finding on transfers to arbitrum escrow that violates invariant", async () => {
    setL1Balance(L1_DAI, ARBITRUM_ESCROW, BigNumber.from("45000"), 1);
    setL2TotalSupply(L2_DAI, BigNumber.from("50000"), 1);
    setProviderBlock(1);
    const mockTxEvent = new TestTransactionEvent()
      .setBlock(1)
      .addEventLog(TRANSFER_EVENT, ARBITRUM_ESCROW, [
        createAddress("0x456"),
        ARBITRUM_ESCROW,
        BigNumber.from("234566666"),
      ]);
    const findings = await handleTransaction(mockTxEvent);
    const expectedFinding = createFinding({
      source: createAddress("0x456"),
      destination: ARBITRUM_ESCROW,
      amount: BigNumber.from("234566666").toString(),
      l1Balance: "45000",
      l2TotalSupply: "50000",
      chain: "arbitrum",
    });
    expect(findings).toStrictEqual([expectedFinding]);
    expect(mockProvider.call).toBeCalledTimes(2);
    expect(cache.has(`${L1_DAI}-1`)).toStrictEqual(true);
    expect(cache.has(`${L2_DAI}-1`)).toStrictEqual(true);
    expect(cache.get(`${L1_DAI}-1`)).toStrictEqual(BigNumber.from("45000"));
    expect(cache.get(`${L2_DAI}-1`)).toStrictEqual(BigNumber.from("50000"));
  });

  it("Returns empty finding on transfers to arbitrum escrow that doesn't violates invariant", async () => {
    setL1Balance(L1_DAI, ARBITRUM_ESCROW, BigNumber.from("50000"), 2);
    setL2TotalSupply(L2_DAI, BigNumber.from("45000"), 2);
    setProviderBlock(2);
    const mockTxEvent = new TestTransactionEvent()
      .setBlock(2)
      .addEventLog(TRANSFER_EVENT, ARBITRUM_ESCROW, [
        createAddress("0x456"),
        ARBITRUM_ESCROW,
        BigNumber.from("234566666"),
      ]);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
    expect(mockProvider.call).toBeCalledTimes(4);
    expect(cache.has(`${L1_DAI}-2`)).toStrictEqual(true);
    expect(cache.has(`${L2_DAI}-2`)).toStrictEqual(true);
    expect(cache.get(`${L1_DAI}-2`)).toStrictEqual(BigNumber.from("50000"));
    expect(cache.get(`${L2_DAI}-2`)).toStrictEqual(BigNumber.from("45000"));
  });

  it("Returns empty finding on transfers to optimism escrow that violates invariant", async () => {
    setL1Balance(L1_DAI, OPTIMISM_ESCROW, BigNumber.from("45000"), 3);
    setL2TotalSupply(L2_DAI, BigNumber.from("50000"), 3);
    setProviderBlock(3);
    const mockTxEvent = new TestTransactionEvent()
      .setBlock(3)
      .addEventLog(TRANSFER_EVENT, OPTIMISM_ESCROW, [
        createAddress("0x456"),
        OPTIMISM_ESCROW,
        BigNumber.from("234566666"),
      ]);
    const findings = await handleTransaction(mockTxEvent);
    const expectedFinding = createFinding({
      source: createAddress("0x456"),
      destination: OPTIMISM_ESCROW,
      amount: BigNumber.from("234566666").toString(),
      l1Balance: "45000",
      l2TotalSupply: "50000",
      chain: "optimism",
    });
    expect(findings).toStrictEqual([expectedFinding]);
    expect(mockProvider.call).toBeCalledTimes(6);
    expect(cache.has(`${L1_DAI}-3`)).toStrictEqual(true);
    expect(cache.has(`${L2_DAI}-3`)).toStrictEqual(true);
    expect(cache.get(`${L1_DAI}-3`)).toStrictEqual(BigNumber.from("45000"));
    expect(cache.get(`${L2_DAI}-3`)).toStrictEqual(BigNumber.from("50000"));
  });

  it("Returns empty finding on transfers to optimism escrow that doesn't violates invariant", async () => {
    setL1Balance(L1_DAI, OPTIMISM_ESCROW, BigNumber.from("50000"), 4);
    setL2TotalSupply(L2_DAI, BigNumber.from("45000"), 4);
    setProviderBlock(4);
    const mockTxEvent = new TestTransactionEvent()
      .setBlock(4)
      .addEventLog(TRANSFER_EVENT, OPTIMISM_ESCROW, [
        createAddress("0x456"),
        OPTIMISM_ESCROW,
        BigNumber.from("234566666"),
      ]);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
    expect(mockProvider.call).toBeCalledTimes(8);
    expect(cache.has(`${L1_DAI}-4`)).toStrictEqual(true);
    expect(cache.has(`${L2_DAI}-4`)).toStrictEqual(true);
    expect(cache.get(`${L1_DAI}-4`)).toStrictEqual(BigNumber.from("50000"));
    expect(cache.get(`${L2_DAI}-4`)).toStrictEqual(BigNumber.from("45000"));
  });
});
