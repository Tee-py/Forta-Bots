## Title

#### MakerDAO Brigde Bot

## Description

This bots scans every DAI transfer made to makerdao arbitrum and optimism DAI bridge and sends an alert when the 
total supply of DAI on arbitrum or optimism exceeds the DAI balance of their respective escrow contracts.

## Supported Chains

- Ethereum

## Alerts

- OPT-INV
  - Fired when a transaction causes the total supply of DAI on optimism to exceed the balance of  DAI on optimism escrow.
  - Severity is always set to "Critical".
  - Type is always set to "Suspicious".
  - Metadata contains `source`, `destination`, `amount`, `l1Balance`, `l2totalSupply`, and `chain`.
    - source: The sender of the DAI token.
    - destination: This is always the OPTIMISM-L1 ESCROW address.
    - amount: The amount of DAI sent.
    - l1Balance: The DAI balance of the optimism escrow.
    - l2totalSupply: The total supply of DAI tokens on optimism.
    - chan: This is always set to `optimism`.
  
- ARB-INV
  - Fired when a transaction causes the total supply of DAI on arbitrum to exceed the balance of  DAI on arbitrum escrow.
  - Severity is always set to "Critical".
  - Type is always set to "Suspicious".
  - Metadata contains `source`, `destination`, `amount`, `l1Balance`, `l2totalSupply`, and `chain`.
    - source: The sender of the DAI token.
    - destination: This is always the ARBITRUM-L1 ESCROW address.
    - amount: The amount of DAI sent.
    - l1Balance: The DAI balance of the arbitrum escrow.
    - l2totalSupply: The total supply of DAI tokens on optimism.
    - chan: This is always set to `arbitrum`.

## Test Data

The bot behaviour can be verified with the following transactions:

- 0xa7430ec3ae191aa508cb645aa5da27e5852df9abeb9da7a4bf659c01c5458b94 (For Arbitrum)
- 0x9f9003774db4901bcfc7ad192e8d6a3f454dacefd73773a28266f3a998774194 (For Optimism)
