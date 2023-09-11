# sequence-gdc-2023-poap-claimer

A simple 2 step process to 1) sign into a Sequence wallet & 2) claim a POAP, with the wallet displaying a wallet pop up with POAP.

## RPC server

Status Codes
- 1: success claim
- 2: user has already claimed a POAP from event 
- 3: claim code race condition, must retry
- 4: poap endpoint service error
- 5: claim links exhausted
- 6: ethauthproof invalid