import { Result } from "ethers/lib/utils"
import { providers } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent"
import { computePoolAddress, FeeAmount } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";

type MetaData = {
    [key: string]: string
}


export const createSwapFinding = (metadata: MetaData): Finding => {
    return Finding.fromObject({
        name: "New UniswapV3 swap",
        description: "Swapped blablabla",
        alertId: "V3-SWAP",
        protocol: "NETHERMIND",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata,
      })
}

export const createSwapMetaData = (eventArgs: Result): MetaData  => {
    const [ sender, recipient, amount0, amount1, , , ] = eventArgs;
    return { sender, recipient, amountIn: amount0.toString(), amountOut: amount1.abs().toString()}
}

export const feeToFeeAmount = (fee: string): FeeAmount => {
    if (fee == "100") return FeeAmount.LOWEST;
    if (fee == "500") return FeeAmount.LOW;
    if (fee == "3000") return FeeAmount.MEDIUM;
    if (fee == "10000") return FeeAmount.HIGH;
    return FeeAmount.LOW;
}

export const isUniSwapPool = async (factoryAddress: string, pairAddress: string, token0: string, token1: string, fee: FeeAmount): Promise<boolean> => {
    let tokenA = new Token(1234, token0, 18);
    let tokenB = new Token(1234, token1, 18);
    const poolAddress = await computePoolAddress({factoryAddress, tokenA, tokenB, fee});
    return poolAddress.toLowerCase() == pairAddress.toLowerCase();
}