# Pokepvp — situs (Black Gold Card Arena)

Situs statis (HTML + vanilla JS, tanpa build step) untuk koleksi Pokepvp:
NFT PokepvpNode (5 edisi) yang menambang token $PVP di BNB Chain, plus
lapisan tema dari prototipe (12 spesies, rarity, koleksi demo, simulasi
level-up, dan duel arena).

| File | Isi |
|---|---|
| `index.html` | Halaman utama: hero, Mint Lab (5 edisi), Mining (statistik + My Nodes + klaim), Collection, Growth, Duel Arena |
| `app.js` | Semua logika: wallet EIP-1193, mint `mint(uint8)`, bacaan on-chain via `eth_call`, panel My Nodes & klaim |
| `styles.css` | Gaya prototipe + tambahan untuk edisi, prompt agen, dan seksi Mining |
| `deploy.html` | Alat deploy khusus owner (pola yang sama dengan Agent Card Studio) |
| `llms.txt` | Instruksi mint + klaim yang bisa dibaca mesin / AI agent |
| `pokepvp-mark.svg` | Logo (juga ada salinan di `public/`) |

## Mengisi alamat kontrak setelah deploy

Situs dikirim dengan alamat kosong dan menampilkan status
"contract not configured yet" — tidak ada fitur on-chain yang aktif
sampai langkah ini selesai.

1. Owner men-deploy lewat `deploy.html`, urutan wajib:
   **PokepvpNode → PvpToken (reserve = alamat NFT) → setToken** →
   opsional `setBaseURI`.
2. Salin dua alamat hasilnya dari kotak ringkasan `deploy.html`.
3. Isi di bagian atas `app.js`:

   ```js
   const POKEPVP_CONFIG = {
     nftAddress: "0x…",   // PokepvpNode
     tokenAddress: "0x…", // PvpToken ($PVP)
     chainId: "0x38"
   };
   ```

   `tokenAddress` boleh dikosongkan — situs akan membacanya dari
   `nft.pvpToken()`. Alternatif tanpa edit file: suntikkan
   `window.POKEPVP_NFT_ADDRESS` sebelum `app.js` dimuat.
4. Isi juga placeholder alamat di `llms.txt` (bagian Contracts).
5. Muat ulang situs: statistik Mining, tombol Starter (cek `freeUsed`),
   dan panel My Nodes akan membaca langsung dari kontrak.

## Catatan perilaku

- Mint Starter (edisi 0) gratis — value transaksi persis 0, maks 1 per
  wallet. Edisi berbayar memakai harga persis: Bronze 0.000284, Silver
  0.000709, Gold 0.00142, Diamond 0.00426 BNB, gasLimit 600000.
- Klaim $PVP hanya bisa dari wallet pemilik token (`claim(tokenId)`),
  tanpa fee. Tombol Claim All mengklaim satu per satu secara berurutan.
- Bacaan publik (statistik, My Nodes dari alamat tempel) memakai wallet
  yang terhubung bila ada, atau RPC publik BSC sebagai cadangan.
- Growth (level-up) dan Duel Arena adalah simulasi front-end dari
  prototipe — tidak ada transaksi on-chain di kedua fitur itu, dan
  salinan halamannya menyatakan itu dengan jujur.
- Kontrak: `~/workspace/projects/pokepvp/` (README di sana menjelaskan
  urutan deploy dan desain era/klaim; hasil uji lokal 32 PASS, 0 FAIL).
