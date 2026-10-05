DEFAULT_ADMIN_ROLE
REWARD_MANAGER_ROLE
PAUSER_ROLE

FLEXIBLE = 5%
LOCK_90 = 10%
LOCK_180 = 15%
LOCK_365 = 20%

MIN_STAKE = 500 ether
MAX_STAKE = 10_000_000 ether

AccessControl
Pausable
ReentrancyGuard

stake()
claim()
unstake()
pendingRewards()
pause()
unpause()