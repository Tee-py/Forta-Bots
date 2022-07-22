# New Agent Deployment Bot

## Description

This Bot Detects when there's a new bot deployed by Nethermind Deployer Address.

## Supported Chains

- POLYGON

## Alerts

- NETHERMIND-1
  - Fired when `createAgent` function is called on Forta Contract.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `metadata`: deployed bot metadata.
    - `agentId`: bot agentid.
    - `owner`: bot deployer.
    - `chainIds`: supported chains of the bot.

## Test Transaction

Run The Bot Against Transaction :

- 0x7b3a2acef6aa72c80eaf036357e11f2ee5931f2eea8b546421e5ea18b299b4ee
