# @peeramid-labs/multipass

## 0.3.3

### Patch Changes

- [#27](https://github.com/peeramid-labs/multipass/pull/27) [`7dce7540ff7f28bbaea7c135e14459c261890d02`](https://github.com/peeramid-labs/multipass/commit/7dce7540ff7f28bbaea7c135e14459c261890d02) Thanks [@peersky](https://github.com/peersky)! - added boundry case protection for registering collusions

- [#31](https://github.com/peeramid-labs/multipass/pull/31) [`03583120cd860a38aecb8c1a86d221b6049e7a25`](https://github.com/peeramid-labs/multipass/commit/03583120cd860a38aecb8c1a86d221b6049e7a25) Thanks [@peersky](https://github.com/peersky)! - deployment to arbitrum sepolia

## 0.3.2

### Patch Changes

- [#26](https://github.com/peeramid-labs/multipass/pull/26) [`4ece252cec47b55f9a824f613cd2207ec2db6e7d`](https://github.com/peeramid-labs/multipass/commit/4ece252cec47b55f9a824f613cd2207ec2db6e7d) Thanks [@peersky](https://github.com/peersky)! - added viem compatible abi export during compilation

## 0.3.1

### Patch Changes

- [`7f56fd2b1a1caf6f86a025874bd1326927a632bd`](https://github.com/peeramid-labs/multipass/commit/7f56fd2b1a1caf6f86a025874bd1326927a632bd) Thanks [@peersky](https://github.com/peersky)! - added deployment artifacts

- [#20](https://github.com/peeramid-labs/multipass/pull/20) [`d2145575c7207b4a40cd6d7b3c1687280b9c2cb7`](https://github.com/peeramid-labs/multipass/commit/d2145575c7207b4a40cd6d7b3c1687280b9c2cb7) Thanks [@theKosmoss](https://github.com/theKosmoss)! - Register username playbook

## 0.3.0

### Minor Changes

- [#22](https://github.com/peeramid-labs/multipass/pull/22) [`c8f2f23b888e503171b74b65ff09b4310be4c178`](https://github.com/peeramid-labs/multipass/commit/c8f2f23b888e503171b74b65ff09b4310be4c178) Thanks [@theKosmoss](https://github.com/theKosmoss)! - Refactored deadline to validUntil

- [#6](https://github.com/peeramid-labs/multipass/pull/6) [`5afd7a4b67bb744baca83d7f6706762959c1a83e`](https://github.com/peeramid-labs/multipass/commit/5afd7a4b67bb744baca83d7f6706762959c1a83e) Thanks [@peersky](https://github.com/peersky)! - added renewal fees and ability to change them

- [#6](https://github.com/peeramid-labs/multipass/pull/6) [`648f04924d30f80df7477d3d319508bfe17f57cb`](https://github.com/peeramid-labs/multipass/commit/648f04924d30f80df7477d3d319508bfe17f57cb) Thanks [@peersky](https://github.com/peersky)! - - Added `validUntil` property to domain records

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

### Patch Changes

- [#18](https://github.com/peeramid-labs/multipass/pull/18) [`10e2211ede2080349acf66b77bd85b9848c93a94`](https://github.com/peeramid-labs/multipass/commit/10e2211ede2080349acf66b77bd85b9848c93a94) Thanks [@theKosmoss](https://github.com/theKosmoss)! - Moved initialize domain playbook from contracts into multipass

## 0.2.0

### Minor Changes

- [`3cfbd82d4a8b9840bbe0ed001088cca0a361e626`](https://github.com/peeramid-labs/multipass/commit/3cfbd82d4a8b9840bbe0ed001088cca0a361e626) Thanks [@peersky](https://github.com/peersky)! - initial release
