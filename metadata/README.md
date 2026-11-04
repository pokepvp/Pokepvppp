# Pokepvp NFT metadata

ERC-721 metadata for Pokepvp Creature (PKVP), served by GitHub Pages.

- `<tokenId>.json` for token IDs 1-10000 (e.g. `1.json`) - the NFT contract's
  tokenURI(id) resolves here once the owner sets the base URI to
  `https://pokepvp.fun/metadata/` (deploy.html step 05).
- `images/<species>.svg` - one image per species (12 species).
- Species assignment is deterministic: a seeded shuffle (mulberry32, seed
  20261104) over the exact supply slots - Common 2,000 per species,
  Rare 400, Legendary 100 (10,000 total).
- Edition and hash rate are NOT metadata traits: they are set on-chain by the
  price paid at mint (see the contract's editionOf / hashRateOf).
