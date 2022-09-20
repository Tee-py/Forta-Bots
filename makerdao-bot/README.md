## Title

#### MakerDAO Brigde Bot

## Description

This bots scans every DAI transfer made to makerdao arbitrum and optimism DAI bridge and sends an alert when the 
total supply of DAI on arbitrum or optimism exceeds the DAI balance of their respective escrow contracts.

## Supported Chains

- Ethereum
- Arbitrum
- Optimism

## Alerts

- OPTIMISM-DAI-TOTAL-SUPPLY
  - Reports the total supply of optimism DAI token on new bridge transaction.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains `destination`, `amount`, `chainId`, `totalSupply`, and `chain`.
    - destination: Recipient address.
    - amount: The amount of DAI sent.
    - chainId: Always optimism chain id.
    - totalSupply: The total supply of DAI tokens on optimism.
    - chain: This is always set to `optimism`.
  
- ARBITRUM-DAI-TOTAL-SUPPLY
  - Reports the total supply of arbitrum DAI token on new bridge transaction.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains `destination`, `amount`, `chainId`, `totalSupply`, and `chain`.
    - destination: Recipient address.
    - amount: The amount of DAI sent.
    - chainId: Always arbitrum chain id.
    - totalSupply: The total supply of DAI tokens on optimism.
    - chain: This is always set to `arbitrum`.

- OPTIMISM-INVARIANT-VIOLATION
  - Fired when a transaction causes the total supply of DAI on optimism to exceed the balance of DAI on optimism escrow.
  - Severity is always set to "Critical".
  - Type is always set to "Suspicious".
  - Metadata contains `balance`, `amount`, `totalSupply`, and `chain`.
    - balance: Balance of optimism l1 escrow.
    - totalSupply: The total supply of DAI tokens on optimism.
    - chain: This is always set to `optimism`.

- ARBITRUM-INVARIANT-VIOLATION
  - Fired when a transaction causes the total supply of DAI on optimism to exceed the balance of DAI on arbitrum escrow.
  - Severity is always set to "Critical".
  - Type is always set to "Suspicious".
  - Metadata contains `balance`, `amount`, `totalSupply`, and `chain`.
    - balance: Balance of arbitrum l1 escrow.
    - totalSupply: The total supply of DAI tokens on arbitrum.
    - chain: This is always set to `arbitrum`.

## Test Data

The bot behaviour can be verified with the following transactions:

- 0x8ee0465ab7745541f694d7159052e98104a456e6842df0c7e2837e5c8eaed9f6 (For Arbitrum)
- 0xbe8e902a16c1a747d338598bf985527bc43f2c1301c7da37b3142ce26de3cd3a (For Optimism)
- 0xf5901e7bde1c88614ea53db58e61e80880ef1eb4e8513bb4d1b9502700a7e24e (For Arbitrum L1)
- 0x962b6a99fd007f9878ac005c789d8a4b7d73d7b0e910f06020754fed27c26c07 (For Optimism L1)
