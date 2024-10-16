# @peeramid-labs/multipass

## 0.3.0

### Minor Changes

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

## 0.2.0

### Minor Changes

- [`3cfbd82d4a8b9840bbe0ed001088cca0a361e626`](https://github.com/peeramid-labs/multipass/commit/3cfbd82d4a8b9840bbe0ed001088cca0a361e626) Thanks [@peersky](https://github.com/peersky)! - initial release
