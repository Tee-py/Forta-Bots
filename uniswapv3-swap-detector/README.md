## Title

#### UniswapV3-Swap-Detector

## Description

This bot detects swaps made on uniswap-v3 pools without keeping a list of uniswap pools.

## Supported Chains

- Ethereum

## Alerts

- V3-SWAP
  - Fired when there's a new swap on uniswap-v3 pool.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains `sender`, `recipient`, `amountIn`, `amountOut` and `poolAddress`.
    - sender: The smart contract caller.
    - recipient: The receiver of the swapped tokens.
    - amountIn: The amount of token swapped.
    - amountOut: The amount of token received.
    - poolAddress: The address of the smart contract (uniswapv3 pool).

## Test Data

The agent behaviour can be verified with the following transactions:

- 0xf46f0eb9502b9f361c6b24c4f56f7ecb93fcc90c9805ccb427942cea47d8cf18
- 0x020f12508ee869fc5eb7306eea45b7865ec2ea66bd9e0f9176ee0e305ac3bc43
