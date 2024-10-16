---
'@peeramid-labs/multipass': major
---

- Added `validUntil` property to domain records
- Added ability to renew records and corresponding nonce checks enforced. 
- Reduced some interface visibility to follow least permission principle
- Removed diamond proxy in favor of more simplistic transparent proxy pattern
- Moved to solidiy compiler version to 0.8.28
- Removed unusued internal functions and events from interfaces
- Removed boolean literals from conditional expressions
- Removed withdraw funds interface. All funds now are sent to owner by default.
- Added security contact email address to docstrings 


## Breaking changes
Register() interface which now has less arguments and uses internal struct parameters, remove unused arguments 

