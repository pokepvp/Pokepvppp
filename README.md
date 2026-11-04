# Pokepvp — site (Black Gold Card Arena)

A static site (HTML + vanilla JS, no build step) for the Pokepvp collection:
the PokepvpNode NFT (5 editions) that mines the $PVP token on BNB Chain, plus
the prototype theme layer (12 species, rarity, demo collection, level-up
simulation, and the duel arena).

| File | Contents |
|---|---|
| `index.html` | Main page: hero, Mint Lab (5 editions), Mining (stats + My Nodes + claims), Collection, Growth, Duel Arena |
| `app.js` | All logic: EIP-1193 wallet, `mint(uint8)`, on-chain reads via `eth_call`, My Nodes panel & claims |
| `styles.css` | Prototype styling + additions for editions, the agent prompt, and the Mining section |
| `deploy.html` | Owner-only deploy tool (same pattern as Agent Card Studio) |
| `llms.txt` | Machine-readable mint + claim instructions for AI agents |
| `pokepvp-mark.svg` | Logo (a copy also lives in `public/`) |

## Filling in the contract addresses after deploy

The site ships with empty addresses and shows a
"contract not configured yet" status — no on-chain feature is active
until this step is done.

1. The owner deploys via `deploy.html`, in this required order:
   **PokepvpNode → PvpToken (reserve = the NFT address) → setToken** →
   optional `setBaseURI`.
2. Copy the two resulting addresses from the `deploy.html` summary box.
3. Fill them in at the top of `app.js`:

   ```js
   const POKEPVP_CONFIG = {
     nftAddress: "0x…",   // PokepvpNode
     tokenAddress: "0x…", // PvpToken ($PVP)
     chainId: "0x38"
   };
   ```

   `tokenAddress` may be left empty — the site reads it from
   `nft.pvpToken()`. Alternative without editing the file: inject
   `window.POKEPVP_NFT_ADDRESS` before `app.js` loads.
4. Also fill in the address placeholders in `llms.txt` (Contracts section).
5. Reload the site: Mining stats, the Starter button (`freeUsed` check),
   and the My Nodes panel will read directly from the contracts.

## Behavior notes

- Starter mint (edition 0) is free — transaction value exactly 0, max 1 per
  wallet. Paid editions use exact prices: Bronze 0.000284, Silver
  0.000709, Gold 0.00142, Diamond 0.00426 BNB, gasLimit 600000.
- $PVP claims can only be made from the token owner's wallet (`claim(tokenId)`),
  with no fee. The Claim All button claims one by one in sequence.
- Public reads (stats, My Nodes from a pasted address) use the connected
  wallet when present, or a public BSC RPC as fallback.
- Growth (level-up) and Duel Arena are front-end simulations from the
  prototype — neither feature makes an on-chain transaction, and the page
  copy states that honestly.
- Contracts: `~/workspace/projects/pokepvp/` (the README there explains
  the deploy order and the era/claim design; local test result 32 PASS, 0 FAIL).
