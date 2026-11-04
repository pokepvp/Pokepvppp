# Pokepvp — mining Node NFTs + PVP token (BNB Chain)

Two fully self-contained contracts (no OpenZeppelin imports), Solidity
0.8.26, in the Agent Card house style. Modeled on the Agentic Node system:
five editions priced in BNB, and every NFT mines the project's ERC-20 from
the moment it is minted, with the yield halving at every era boundary.

| File | What it is |
|---|---|
| `contracts/PokepvpNode.sol` | ERC-721 "Pokepvp Creature" (PKVP) — minting, mining, eras, claims |
| `contracts/PvpToken.sol` | ERC-20 "Pokepvp Token" (PVP) — fixed 1,000,000,000 supply |
| `build/PvpToken.bytecode.txt` / `.abi.json` | Compiled artifacts (creation bytecode, no `0x` prefix) |
| `build/PokepvpNode.bytecode.txt` / `.abi.json` | Same for the NFT contract |
| `compile.js` | Recompiles both with the shared acs-solc setup (paris, viaIR, runs 200) |

Runtime sizes: **PvpToken 1,684 bytes**, **PokepvpNode 8,484 bytes** —
both far under the 24,576-byte EIP-170 limit.

## Editions and mining rates (defaults, owner-adjustable)

| Edition | Price (exact) | Hash rate |
|---|---|---|
| 0 Starter | free — `msg.value` must be 0, max 1 per wallet | 10 PVP/day |
| 1 Bronze | 0.000284 BNB | 50 PVP/day |
| 2 Silver | 0.000709 BNB | 200 PVP/day |
| 3 Gold | 0.00142 BNB | 600 PVP/day |
| 4 Diamond | 0.00426 BNB | 1,500 PVP/day |

The edition is set by the price paid, never by random rarity. Collection
cap is 10,000, token IDs are sequential from 1. Prices change via
`setEditionPrice(edition, price)`, rates via `setEditionRate(edition,
rateWeiPerDay)`; minting is gated by `mintOpen` (default open) and BNB is
withdrawn by the owner with `withdraw()`.

## Deploy order (important)

The token needs the NFT contract's address (its mining reserve) and the
NFT contract needs the token's address, so deploy in this order:

1. **Deploy `PokepvpNode`** (no constructor arguments).
2. **Deploy `PvpToken`** with the NFT contract's address as
   `miningReserve`. The full 1B supply is created here: 600,000,000 PVP
   (60%) goes straight to the NFT contract as the mining reserve,
   400,000,000 PVP (40%) to the deployer.
3. **Call `nft.setToken(pvpTokenAddress)`** (owner only).
4. Call `nft.setBaseURI("ipfs://<CID>/")` so `tokenURI(id)` returns
   `baseURI + id + ".json"` (off-chain JSON metadata, like the original
   PokepvpNFT design).

`setToken` is owner-changeable at any time (not one-shot), so a wiring
mistake is recoverable without redeploying.

## Era and claim design

- **Eras.** Era 1 starts at deployment. An era ends after **30 days** or
  once **150,000 shares** are in circulation, whichever comes first, and
  the yield multiplier halves at each boundary (era *n* pays
  `rate / 2^(n-1)`). There are at most **11 eras**; after era 11 the
  multiplier stays at the era-11 level (2^-10) forever.
- **What counts as "shares".** Shares are PVP/day of hash rate **minted
  inside the current era** (tracked as `eraShares`; a Diamond adds 1,500).
  This is the one deliberate interpretation call: the literal alternative —
  comparing the *total* network hash rate against 150,000 — breaks down,
  because total hash rate never decreases, so the moment it crossed
  150,000 every later era would end instantly and all 11 eras would
  cascade in a single transaction. Counting shares minted per era matches
  the reference site's wording ("150,000 shares are minted network-wide"
  per era) and keeps the trigger meaningful in every era. On a
  share-triggered advance the overshoot remainder carries into the new
  era; on a time-triggered advance the counter restarts at 0.
  `totalHashRate()` still exposes the all-time sum.
- **Lazy era bookkeeping.** Boundaries are *recorded* on-chain
  (`eraStarts[]`) by `mint()`, `claim()` and the permissionless
  `pokeEra()`. A share-triggered boundary is stamped with the time of the
  mint that crossed the threshold; a time-triggered boundary is exact
  (previous start + 30 days). Views (`era()`, `pendingOf()`) extend the
  recorded timeline virtually: since hash rate only ever changes at a
  mint — and every mint records pending boundaries first — the only
  boundaries that can be missing from storage are future 30-day marks,
  which are deterministic. So view results always agree with what the
  next state-changing call will record.
- **Accrual.** `pendingOf(tokenId)` walks from the token's `lastUpdate`
  (mint time, or last claim) to now in at most 11 era segments:
  `accrued += rate * seconds / (86400 * 2^(era-1))`, all integer math in
  PVP wei.
- **Claiming.** `claim(tokenId)` is token-owner-only; it settles
  `pendingOf`, resets `lastUpdate`, and transfers the PVP out of this
  contract's reserve balance. Unclaimed yield **follows the token** when
  it is transferred — the new owner claims everything accrued since the
  last claim. If the 600M reserve is ever exhausted, claims revert on the
  token transfer (insufficient balance) while minting and transfers keep
  working.
- **Rate-change caveat.** `pendingOf` prices a token's whole unclaimed
  window at the edition rate in force *when it is read*. If the owner
  changes an edition's rate, unclaimed accrual for that edition is
  repriced retroactively. Operationally: settle claims (or accept the
  repricing) before changing rates.
- **Starter price note.** Edition 0 follows the same exact-price rule as
  every edition; its default price is 0, which is what enforces
  "free, gas only". If the owner sets a nonzero Starter price, the tier
  stops being free (the 1-per-wallet limit still applies).

## Verification

Compiled with solc 0.8.26 (`evmVersion: paris`, `viaIR: true`, optimizer
runs 200), then exercised end-to-end on a local ganache chain
(`~/workspace/tmp-check/evm/pokepvp-test.cjs`): deploy in the documented
order, token split (600M reserve / 400M deployer), free Starter mint,
second-Starter revert, exact-price enforcement, Diamond mint at
0.00426 BNB, 1-day accrual (1,500 PVP Diamond / 10 PVP Starter),
non-owner claim revert, claim settlement against the reserve, era
advance past 30 days with the next day's accrual halved to 750 PVP,
`mintOpen` gate, transfer enumeration (`tokensOfOwner`) with yield
following the token, and owner BNB withdrawal.

**Result: 32 PASS, 0 FAIL.**

One environment note: this sandbox's ganache transport intermittently
drops `eth_estimateGas` responses and the ethers provider intermittently
returns pre-transaction balances, which initially masqueraded as contract
failures. Each case was isolated with `staticCall`, explicit-gas sends
and raw JSON-RPC reads — all confirmed the contracts behave correctly;
the final test works around the two harness quirks (explicit gas limit
on one send, raw `eth_getBalance` for the withdrawal assertions).

Nothing has been deployed to any live network.
