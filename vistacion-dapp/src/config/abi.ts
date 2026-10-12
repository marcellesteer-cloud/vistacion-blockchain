export const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function burnBasisPoints() view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
] as const;

export const STAKING_ABI = [
  "function aprBps() view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function rewardPool() view returns (uint256)",
  "function positions(address account) view returns (uint256 amount, uint256 updatedAt, uint256 rewards)",
  "function pendingRewards(address account) view returns (uint256)",
  "function stake(uint256 amount)",
  "function claim()",
  "function unstake(uint256 amount)",
] as const;

export const ESCROW_ABI = [
  "function oracle() view returns (address)",
  "function nextId() view returns (uint256)",
  "function deals(uint256 id) view returns (address buyer, address seller, uint256 amount, bool docsSubmitted, bool resolved)",
  "function createEscrow(address seller, uint256 amount) returns (uint256 id)",
  "function submitDocs(uint256 id)",
  "function verifyAndRelease(uint256 id, bool ok)",
] as const;

export const GOVERNANCE_ABI = [
  "function proposals(uint256 id) view returns (string description, uint256 endTime, uint256 forVotes, uint256 againstVotes, bool executed)",
  "function voted(uint256 id, address account) view returns (bool)",
  "function createProposal(string description, uint256 duration) returns (uint256 id)",
  "function vote(uint256 id, bool support)",
  "function execute(uint256 id)",
] as const;

export const ICO_ABI = [
  "function treasury() view returns (address)",
  "function priceWeiPerToken() view returns (uint256)",
  "function start() view returns (uint256)",
  "function end() view returns (uint256)",
  "function buy() payable",
] as const;
