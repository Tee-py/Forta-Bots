import { HandleTransaction } from "forta-agent";
import { provideTransactionHandler } from "./agent";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import LRU from "lru-cache";
import { BigNumber, ethers, utils } from "ethers";
import { UNISWAP_V3_POOL_ABI, V3_FACTORY_CONTRACT_ADDRESS } from "./constants";
import { createSwapFinding } from "./utils";

const TEST_DATA = {
  from: "0x42e7b1e1aecdd9262e6b5f07dcadb7a9beace7ef",
  to: "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
  poolAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
  sender: "0xBEEFBaBEeA323F07c59926295205d3b7a17E8638",
  recipient: "0xBEEFBaBEeA323F07c59926295205d3b7a17E8638",
  token0: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  fee: "500",
  amount0: BigNumber.from("1000"),
  amount1: BigNumber.from("5000"),
  sqrtPriceX96: BigNumber.from("6789"),
  liquidity: BigNumber.from("5609"),
  tick: BigNumber.from("6787"),
};

describe("UNISWAP BOT TEST", () => {
  let handleTransaction: HandleTransaction;
  let poolCache: LRU<string, boolean>;
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let Ipool: utils.Interface;

  const setPool = (poolAddress: string, token0: string, token1: string, fee: string) => {
    mockProvider.addCallTo(poolAddress, 0, Ipool, "token0", { inputs: [], outputs: [token0]});
    mockProvider.addCallTo(poolAddress, 0, Ipool, "token1", {inputs: [], outputs: [token1]});
    mockProvider.addCallTo(poolAddress, 0, Ipool, "fee", { inputs: [], outputs: [BigNumber.from(fee)]});
  }

  beforeEach(() => {
    poolCache = new LRU<string, boolean>({ max: 500 });
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;
    Ipool = new utils.Interface(UNISWAP_V3_POOL_ABI);
    handleTransaction = provideTransactionHandler(V3_FACTORY_CONTRACT_ADDRESS, provider, poolCache);
  });

  it("Returns nothing if there's no swap event", async () => {
    const mockTxEvent = new TestTransactionEvent();
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("Returns finding if there's a swap event on uniswap v3 pool and pool Cache works", async () => {
    
    const mockTxEvent = new TestTransactionEvent()
      .setFrom(TEST_DATA.from)
      .setTo(TEST_DATA.to)
      .setBlock(0)
      .addEventLog(UNISWAP_V3_POOL_ABI[0], TEST_DATA.poolAddress, [
        TEST_DATA.sender,
        TEST_DATA.recipient,
        TEST_DATA.amount0,
        TEST_DATA.amount1,
        TEST_DATA.sqrtPriceX96,
        TEST_DATA.liquidity,
        TEST_DATA.tick,
      ]);
    
    setPool(TEST_DATA.poolAddress, TEST_DATA.token0, TEST_DATA.token1, TEST_DATA.fee);
    const findings = await handleTransaction(mockTxEvent);
    const expectedFinding = createSwapFinding({
      poolAddress: TEST_DATA.poolAddress,
      sender: TEST_DATA.sender,
      recipient: TEST_DATA.recipient,
      amountIn: TEST_DATA.amount0.toString(),
      amountOut: TEST_DATA.amount1.toString(),
    });
    expect([expectedFinding]).toStrictEqual(findings);
    expect(poolCache.has(TEST_DATA.poolAddress)).toStrictEqual(true);
  });

  it("Returns empty finding if swap is not a valid pool", async () => {
    setPool("0x45c54210128a065de780C4B0Df3d16664f7f859e", TEST_DATA.token0, TEST_DATA.token1, TEST_DATA.fee);
    const mockTxEvent = new TestTransactionEvent()
      .setFrom(TEST_DATA.from)
      .setTo(TEST_DATA.to)
      .addEventLog(UNISWAP_V3_POOL_ABI[0], "0x45c54210128a065de780C4B0Df3d16664f7f859e", [
        TEST_DATA.sender,
        TEST_DATA.recipient,
        TEST_DATA.amount0,
        TEST_DATA.amount1,
        TEST_DATA.sqrtPriceX96,
        TEST_DATA.liquidity,
        TEST_DATA.tick,
      ])
      .setBlock(0);
    const findings = await handleTransaction(mockTxEvent);
    expect([]).toStrictEqual(findings);
  });

  it("Returns empty finding on other events", async () => {
    const mockTxEvent = new TestTransactionEvent()
      .setFrom(TEST_DATA.from)
      .setTo(TEST_DATA.to)
      .addEventLog("event Custom(address addr)", "0x45c54210128a065de780C4B0Df3d16664f7f859e", [
        "0xBEEFBaBEeA323F07c59926295205d3b7a17E8638",
      ])
      .setBlock(0);
    const findings = await handleTransaction(mockTxEvent);
    expect([]).toStrictEqual(findings);
  });
});
