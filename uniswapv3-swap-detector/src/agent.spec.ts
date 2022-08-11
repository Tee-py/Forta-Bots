import { HandleTransaction } from "forta-agent";
import { provideTransactionHandler } from "./agent";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import LRU from "lru-cache";
import { BigNumber, ethers, utils } from "ethers";
import { UNISWAP_V3_POOL_ABI, V3_FACTORY_CONTRACT_ADDRESS } from "./constants";
import { createSwapFinding } from "./utils";

const TEST_DATA = {
  from: createAddress("0x41"),
  to: createAddress("0x42"),
  poolAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
  sender: createAddress("0x43"),
  recipient: createAddress("0x43"),
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

  const setPool = (poolAddress: string, token0: string, token1: string, fee: string, block: number) => {
    mockProvider.addCallTo(poolAddress, block, Ipool, "token0", { inputs: [], outputs: [token0] });
    mockProvider.addCallTo(poolAddress, block, Ipool, "token1", { inputs: [], outputs: [token1] });
    mockProvider.addCallTo(poolAddress, block, Ipool, "fee", { inputs: [], outputs: [BigNumber.from(fee)] });
  };

  const setProviderBlock = (block: number) => {
    mockProvider.setLatestBlock(block);
  };

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
    expect(mockProvider.call).toBeCalledTimes(0);
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

    setPool(TEST_DATA.poolAddress, TEST_DATA.token0, TEST_DATA.token1, TEST_DATA.fee, 0);
    setProviderBlock(0);
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
    expect(mockProvider.call).toBeCalledTimes(3);
  });

  it("Returns empty finding if swap is not a valid pool", async () => {
    setPool(createAddress("0x45"), TEST_DATA.token0, TEST_DATA.token1, TEST_DATA.fee, 0);
    setProviderBlock(0);
    const mockTxEvent = new TestTransactionEvent()
      .setFrom(TEST_DATA.from)
      .setTo(TEST_DATA.to)
      .addEventLog(UNISWAP_V3_POOL_ABI[0], createAddress("0x45"), [
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
    expect(mockProvider.call).toBeCalledTimes(3);
  });

  it("Returns empty finding on other events", async () => {
    setProviderBlock(0);
    const mockTxEvent = new TestTransactionEvent()
      .setFrom(TEST_DATA.from)
      .setTo(TEST_DATA.to)
      .addEventLog("event Custom(address addr)", createAddress("0x45"), [createAddress("0x46")])
      .setBlock(0);
    const findings = await handleTransaction(mockTxEvent);
    expect([]).toStrictEqual(findings);
    expect(mockProvider.call).toBeCalledTimes(0);
  });
});
