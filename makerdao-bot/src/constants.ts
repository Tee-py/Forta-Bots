export const ARBITRUM_ESCROW = "0xa10c7ce4b876998858b1a9e12b10092229539400";
export const OPTIMISM_ESCROW = "0x467194771dae2967aef3ecbedd3bf9a310c76c65";
export const OPTIMISM_DAI_BRIDGE = "0x467194771dae2967aef3ecbedd3bf9a310c76c65";
export const ARBITRUM_CHAIN_ID = 42161;
export const OPTIMISM_CHAIN_ID = 10;
export const OPTIMISM_BOT_ID = "";
export const ARBITRUM_BOT_ID = "";
export const OPTIMISM_ALERT_ID = "OPTIMISM-DAI-TOTAL-SUPPLY";
export const ARBITRUM_ALERT_ID = "ARBITRUM-DAI-TOTAL-SUPPLY";
export const L1_DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
export const L2_DAI = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";
export const ARBITRUM_L1_GATEWAY = "0xd3b5b60020504bc3489d6949d545893982ba3011";
export const L2_BRIDGE = "0x467194771dae2967aef3ecbedd3bf9a310c76c65";
export const DAI_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() view returns (uint256)",
];
export const TRANSFER_EVENT = "event Transfer (address indexed src, address indexed dst, uint256 wad)";
export const OPTIMISM_L2_DEPOSIT_EVENT =
  "event DepositFinalized (address indexed _l1Token, address indexed _l2Token, address indexed _from, address _to, uint256 _amount, bytes _data)";
export const ARBITRUM_L2_DEPOSIT_EVENT =
  "event DepositFinalized (address indexed l1Token, address indexed from, address indexed to, uint256 amount)";
