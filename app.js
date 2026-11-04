const cards = [
  { id: 1, name: 'Voltari', type: 'ARC', rarity: 'LEGENDARY', level: 7, power: 86, tone: 'voltari', evolveAt: 8, evolved: false, supply: 50, minted: 18, desc: 'A neon-charged runner that turns pressure into momentum.', status: 'READY TO DUEL', accent: 'gold' },
  { id: 2, name: 'Emberlyn', type: 'FLARE', rarity: 'RARE', level: 4, power: 63, tone: 'emberlyn', evolveAt: 6, evolved: false, supply: 250, minted: 94, desc: 'A quick-footed spark with a talent for sudden comebacks.', status: 'CHARGE 82%', accent: 'coral' },
  { id: 3, name: 'Mossbyte', type: 'GROVE', rarity: 'COMMON', level: 2, power: 41, tone: 'mossbyte', evolveAt: 5, evolved: false, supply: 1000, minted: 426, desc: 'Small, stubborn, and stronger every time it takes a hit.', status: 'GROWING', accent: 'mint' },
  { id: 4, name: 'Stonefin', type: 'TIDE', rarity: 'COMMON', level: 3, power: 38, tone: 'stonefin', evolveAt: 5, evolved: false, supply: 1000, minted: 311, desc: 'A patient river guardian with a surprisingly hard shell.', status: 'GROWING', accent: 'blue' },
  { id: 5, name: 'Frostbyte', type: 'GLACIER', rarity: 'RARE', level: 5, power: 69, tone: 'frostbyte', evolveAt: 6, evolved: false, supply: 250, minted: 121, desc: 'A cold-blooded tactician that freezes the tempo of a duel.', status: 'CHARGE 91%', accent: 'purple' },
  { id: 6, name: 'Pyrodrake', type: 'INFERNO', rarity: 'LEGENDARY', level: 8, power: 94, tone: 'pyrodrake', evolveAt: 10, evolved: false, supply: 50, minted: 7, desc: 'A sky-borne flare that turns every entrance into a finisher.', status: 'READY TO DUEL', accent: 'coral' },
  { id: 7, name: 'Pebblit', type: 'STONE', rarity: 'COMMON', level: 1, power: 29, tone: 'stonefin', evolveAt: 5, evolved: false, supply: 1000, minted: 508, desc: 'A tiny shield-bearer that learns through every impact.', status: 'GROWING', accent: 'blue' },
  { id: 8, name: 'Bloomox', type: 'BLOOM', rarity: 'COMMON', level: 3, power: 45, tone: 'mossbyte', evolveAt: 5, evolved: false, supply: 1000, minted: 287, desc: 'A gentle forest brute with a hidden second wind.', status: 'GROWING', accent: 'mint' },
  { id: 9, name: 'Aurorix', type: 'AURORA', rarity: 'RARE', level: 6, power: 74, tone: 'frostbyte', evolveAt: 8, evolved: false, supply: 250, minted: 83, desc: 'A prism-winged scout that predicts the next move.', status: 'CHARGE 68%', accent: 'purple' },
  { id: 10, name: 'Cinderclaw', type: 'EMBER', rarity: 'RARE', level: 5, power: 67, tone: 'emberlyn', evolveAt: 7, evolved: false, supply: 250, minted: 157, desc: 'A hot-headed striker that never gives the lead back.', status: 'CHARGE 76%', accent: 'coral' },
  { id: 11, name: 'Solvyr', type: 'CELESTIAL', rarity: 'LEGENDARY', level: 9, power: 98, tone: 'pyrodrake', evolveAt: 10, evolved: false, supply: 50, minted: 3, desc: 'A solar apex creature reserved for the sharpest collectors.', status: 'APEX READY', accent: 'gold' },
  { id: 12, name: 'Noctyra', type: 'ECLIPSE', rarity: 'LEGENDARY', level: 8, power: 91, tone: 'gravemaw', evolveAt: 10, evolved: false, supply: 50, minted: 11, desc: 'A silent eclipse that turns a crowded arena completely still.', status: 'APEX READY', accent: 'purple' }
];
const opponent = { id: 99, name: 'Gravemaw', type: 'VOID', rarity: 'RARE', level: 5, power: 72, tone: 'gravemaw', desc: 'A heavy signal hiding a precise counter.', status: 'RIVAL SIGNAL', accent: 'purple' };
let selectedId = 1;
let pendingCard = null;
let material = 4;
const maxLevel = 10;
// ── Konfigurasi kontrak ─────────────────────────────────────────────
// Alamat diisi SETELAH owner men-deploy kedua kontrak lewat deploy.html.
// Selama kosong (""), situs menampilkan status "kontrak belum dikonfigurasi"
// dan semua bacaan on-chain dilewati dengan aman — tidak ada yang error.
const POKEPVP_CONFIG = {
  nftAddress: "",   // PokepvpNode (NFT) — diisi setelah deploy
  tokenAddress: "", // PvpToken ($PVP) — diisi setelah deploy; kosong = dibaca dari nft.pvpToken()
  chainId: "0x38"   // BNB Smart Chain Mainnet
};
const NFT_CONTRACT_ADDRESS = POKEPVP_CONFIG.nftAddress || window.POKEPVP_NFT_ADDRESS || "";
const TOKEN_CONTRACT_ADDRESS = POKEPVP_CONFIG.tokenAddress || "";
const BNB_MAINNET_CHAIN_ID = POKEPVP_CONFIG.chainId;
// Lima edisi PokepvpNode. Edisi ditentukan oleh harga yang dibayar — tidak pernah acak.
// priceWei harus sama persis dengan editionPrice di kontrak.
const EDITIONS = [
  { name: "Starter", priceWei: "0",               priceBNB: "0",        ratePerDay: 10 },
  { name: "Bronze",  priceWei: "284000000000000", priceBNB: "0.000284", ratePerDay: 50 },
  { name: "Silver",  priceWei: "709000000000000", priceBNB: "0.000709", ratePerDay: 200 },
  { name: "Gold",    priceWei: "1420000000000000", priceBNB: "0.00142", ratePerDay: 600 },
  { name: "Diamond", priceWei: "4260000000000000", priceBNB: "0.00426", ratePerDay: 1500 }
];
// Selector fungsi kontrak (keccak 4 byte pertama).
const SEL = {
  mint: "0x6ecd2306",          // mint(uint8)
  claim: "0x379607f5",         // claim(uint256)
  totalMinted: "0xa2309ff8",   // totalMinted()
  mintOpen: "0x24bbd049",      // mintOpen()
  freeUsed: "0x2626c4bf",      // freeUsed(address)
  mintCount: "0xed9ec888",     // mintCount(address)
  editionOf: "0x4be185f0",     // editionOf(uint256)
  editionPrice: "0x38d37b9b",  // editionPrice(uint256)
  hashRateOf: "0x53b6eb99",    // hashRateOf(uint256)
  pendingOf: "0x7e7feaa7",     // pendingOf(uint256)
  era: "0x143e55e0",           // era()
  totalHashRate: "0xda3b6b35", // totalHashRate()
  tokensOfOwner: "0x8462151c", // tokensOfOwner(address)
  pvpToken: "0x12bbb811",      // pvpToken()
  balanceOf: "0x70a08231"      // ERC-20 balanceOf(address)
};
const MINT_SELECTOR = SEL.mint;
const TOKEN_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628cd55f3c5b5a7d382b';
let walletAddress = null;

function contractsReady() { return validContractAddress(NFT_CONTRACT_ADDRESS); }
function pad32(hexNoPrefix) { return hexNoPrefix.padStart(64, '0'); }
function encAddress(address) { return pad32(String(address).toLowerCase().replace(/^0x/, '')); }
function encUint(value) { return pad32(BigInt(value).toString(16)); }
const BSC_RPC_URL = 'https://bsc-dataseed.binance.org';
async function ethCall(to, data) {
  if (window.ethereum) return window.ethereum.request({ method: 'eth_call', params: [{ to, data }, 'latest'] });
  const res = await fetch(BSC_RPC_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to, data }, 'latest'] }) });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'RPC error');
  return json.result;
}
async function readUint(to, data) { const out = await ethCall(to, data); return (!out || out === '0x') ? 0n : BigInt(out); }
async function readBool(to, data) { return (await readUint(to, data)) !== 0n; }
async function readAddress(to, data) { const out = await ethCall(to, data); return (!out || out === '0x') ? '' : '0x' + out.slice(-40); }
async function readUintArray(to, data) {
  const out = await ethCall(to, data);
  if (!out || out === '0x') return [];
  const hex = out.replace(/^0x/, '');
  const length = Number(BigInt('0x' + hex.slice(64, 128)));
  const items = [];
  for (let i = 0; i < length; i += 1) items.push(Number(BigInt('0x' + hex.slice(128 + i * 64, 128 + (i + 1) * 64))));
  return items;
}
function formatPVP(wei) {
  const v = BigInt(wei);
  const whole = v / 1000000000000000000n;
  const frac = (v % 1000000000000000000n).toString().padStart(18, '0').slice(0, 4).replace(/0+$/, '');
  const wholeText = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? `${wholeText}.${frac}` : wholeText;
}
let tokenAddressCache = '';
async function resolveTokenAddress() {
  if (validContractAddress(TOKEN_CONTRACT_ADDRESS)) return TOKEN_CONTRACT_ADDRESS;
  if (tokenAddressCache) return tokenAddressCache;
  if (!contractsReady()) return '';
  try { const a = await readAddress(NFT_CONTRACT_ADDRESS, SEL.pvpToken); if (validContractAddress(a) && a.toLowerCase() !== '0x0000000000000000000000000000000000000000') tokenAddressCache = a; } catch { /* token belum di-set di kontrak */ }
  return tokenAddressCache;
}

function creatureSvg(tone = 'voltari', evolved = false) {
  const common = `<svg class="creature" viewBox="0 0 280 190" role="img" aria-label="Pixel creature artwork">
    <ellipse class="glow" cx="140" cy="113" rx="76" ry="39"/><path class="outline" d="M69 145h16v-9h14v-9h14v-8h18V99h-9V78h-9V54h11v8h11v-17h10v-10h12v10h13v18h11V55h11v-10h11v28h-8v17h-10v26h20v9h17v10h20v10h17v10H69z"/><path class="body" d="M91 137v-16h14v-13h16V91h-8V71h11v11h11V55h16v18h11V58h10v23h12v30h14v8h18v10h20v8h-55v-8h-20v8h-49v10z"/><path class="body-dark" d="M91 137v-16h14V98h16v22h20v17h-15v9H91z"/><path class="accent" d="M87 69h15v14h10v18H96V90H87zM180 72h13v14h10v15h-15V91h-8z"/><path class="accent2" d="M201 116h21v9h14v8h-24v-6h-11z"/><path class="mark" d="M126 102h11v16h-11zM158 93h10v22h-10z"/><path class="eye" d="M113 86h10v10h-10zM171 81h10v10h-10z"/><path class="shine" d="M116 87h4v4h-4zM174 82h4v4h-4z"/><path class="electric" d="M73 121h10v8h8v8H79v-7h-6zM215 50h8v8h8v6h-10v-7h-6z"/><path class="shadow" d="M115 141h63v8h-63z"/>
  </svg>`;
  const ember = `<svg class="creature" viewBox="0 0 280 190" role="img" aria-label="Pixel creature artwork">
    <ellipse class="glow" cx="140" cy="116" rx="77" ry="37"/><path class="outline" d="M61 145h14v-16h10v-14h13V98h12V73h-9V50h14v9h13V43h10v10h10V39h14v18h14V45h13v13h12v19h13v26h14v13h15v12h15v10H61z"/><path class="body" d="M81 137v-18h18v-15h14V78h-7V61h14v12h14V55h15v18h15v-17h12v28h13v27h14v11h23v10h20v5H81z"/><path class="body-dark" d="M81 137v-18h18V98h19v28h24v11H81z"/><path class="flame" d="M82 61h13v12h9v17H91V79H82zM190 61h14v11h9v14h-14V76h-9z"/><path class="accent" d="M205 117h28v9h13v7h-24v-5h-17z"/><path class="eye" d="M118 87h11v10h-11zM173 84h11v10h-11z"/><path class="shine" d="M121 88h4v4h-4zM176 85h4v4h-4z"/><path class="mark" d="M138 99h11v19h-11zM155 102h8v14h-8z"/><path class="shadow" d="M104 141h78v8h-78z"/>
  </svg>`;
  const moss = `<svg class="creature" viewBox="0 0 280 190" role="img" aria-label="Pixel creature artwork">
    <ellipse class="glow" cx="140" cy="116" rx="75" ry="37"/><path class="outline" d="M69 145h15v-16h11v-20h12V80h-9V58h13v7h14V49h13v8h14V43h14v14h13V47h14v18h14v13h11v24h19v12h18v10h19v11H69z"/><path class="body" d="M86 137v-18h15V92h12V72h-8V65h13v9h14V57h14v17h15V58h11v25h14v24h14v11h25v10h21v5H86z"/><path class="body-dark" d="M86 137v-18h15V97h20v28h25v12H86z"/><path class="leaf" d="M86 65h-8V51h10V36h10v18h10v11H95v10H86zM184 66h10V49h10v9h10v15h-12v9h-18z"/><path class="accent" d="M205 118h22v8h16v8h-29v-5h-9z"/><path class="eye" d="M117 86h10v10h-10zM169 87h10v10h-10z"/><path class="shine" d="M120 87h4v4h-4zM172 88h4v4h-4z"/><path class="mark" d="M137 101h9v13h-9zM151 98h8v17h-8z"/><path class="shadow" d="M108 141h69v8h-69z"/>
  </svg>`;
  const grave = `<svg class="creature" viewBox="0 0 280 190" role="img" aria-label="Pixel rival creature artwork">
    <ellipse class="glow" cx="140" cy="116" rx="78" ry="37"/><path class="outline" d="M53 146h19v-12h12V93h10V70h13V48h14v12h14V42h17v17h13V43h14v17h15v13h16v21h15v12h16v12h18v18H53z"/><path class="body" d="M74 138v-15h17V96h10V74h13V59h13v16h14V56h15v22h15v12h17v18h14v11h24v13H74z"/><path class="body-dark" d="M74 138v-15h17V99h21v26h28v13H74z"/><path class="accent2" d="M78 62h15v12h8v15H89V79H78zM185 68h15v12h11v13h-16V82h-10z"/><path class="accent" d="M207 116h21v9h15v8h-28v-6h-8z"/><path class="water" d="M121 89h10v10h-10zM170 86h10v10h-10z"/><path class="shine" d="M124 90h3v3h-3zM173 87h3v3h-3z"/><path class="mark" d="M139 101h10v14h-10zM154 99h9v15h-9z"/><path class="shadow" d="M101 141h76v8h-76z"/>
  </svg>`;
  const artwork = ({ voltari: common, emberlyn: ember, mossbyte: moss, gravemaw: grave, stonefin: moss, frostbyte: grave, pyrodrake: ember }[tone] || common);
  const evolvedMark = `<path class="evolution-crown" d="M119 62h10l7-14 9 14 10-20 9 20h10l-8 10h-38z"/><path class="evolution-aura" d="M65 105h8v-18h7v18h8v8H80v17h-7v-17h-8zM198 104h8V87h7v17h8v8h-8v17h-7v-17h-8z"/>`;
  const evolvedArtwork = evolved ? artwork.replace('</svg>', `${evolvedMark}</svg>`) : artwork;
  const classedArtwork = ['stonefin', 'frostbyte', 'pyrodrake'].includes(tone) ? evolvedArtwork.replace('class="creature"', `class="creature creature-${tone}"`) : evolvedArtwork;
  return evolved ? classedArtwork.replace('class="creature', 'class="creature creature-evolved') : classedArtwork;
}

function cardMarkup(card, compact = false, opponentCard = false) {
  const compactClass = compact ? ' compact-card' : '';
  const rarityClass = card.rarity.toLowerCase();
  return `<article class="${compact ? 'mini-card' : 'arena-card'}${compactClass}${opponentCard ? ' opponent-card' : ''} rarity-${rarityClass}${card.evolved ? ' is-evolved' : ''}">
    <div class="card-top"><span class="card-rarity">${card.rarity} <span>0${card.id}</span></span>${compact ? '' : '<span class="card-control">⌁</span>'}</div>
    <div class="creature-stage ${rarityClass}">${creatureSvg(card.tone, card.evolved)}</div>
    <div class="card-identity"><div><div class="card-name">${card.name}</div><div class="card-sub">${card.type} / LVL ${String(card.level).padStart(2, '0')}${card.level >= maxLevel ? ' · MAX LEVEL' : ''} · ${card.evolved ? 'ASCENDED' : 'BASE FORM'}</div></div><div class="card-power"><span>POWER</span><strong>${card.power}</strong></div></div>
    ${compact ? '' : `<div class="card-data"><div><span>RARITY</span><b>${card.rarity}</b></div><div><span>LEVEL</span><b>${String(card.level).padStart(2, '0')}</b></div><div><span>SUPPLY</span><b>${card.minted}/${card.supply}</b></div></div>`}
    <div class="card-footer"><span>${card.status}</span><b>${opponentCard ? 'OPPONENT' : '● ACTIVE'}</b></div>
  </article>`;
}

function getSelected() { return cards.find(card => card.id === selectedId) || cards[0]; }
function shortenAddress(address) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }
function setWalletButton(label = 'Connect wallet') { const button = document.querySelector('#connectWallet'); if (button) button.textContent = label; }
async function ensureBnbMainnet() {
  if (!window.ethereum) throw new Error('MetaMask tidak ditemukan. Install MetaMask untuk membayar dengan BNB.');
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (chainId === BNB_MAINNET_CHAIN_ID) return true;
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BNB_MAINNET_CHAIN_ID }] });
  } catch (error) {
    if (error.code !== 4902) throw new Error('Silakan pilih BNB Smart Chain Mainnet di MetaMask.');
    await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: BNB_MAINNET_CHAIN_ID, chainName: 'BNB Smart Chain Mainnet', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: ['https://bsc-dataseed.binance.org/'], blockExplorerUrls: ['https://bscscan.com'] }] });
  }
  return true;
}
async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask tidak ditemukan. Install MetaMask untuk menghubungkan wallet.');
  await ensureBnbMainnet();
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  walletAddress = accounts[0] || null;
  setWalletButton(walletAddress ? shortenAddress(walletAddress) : 'Connect wallet');
  showToast(walletAddress ? `Wallet connected: ${shortenAddress(walletAddress)}` : 'Wallet belum dipilih');
  refreshMintButtons();
  const nodesInput = document.querySelector('#nodesAddress');
  if (nodesInput && walletAddress && !nodesInput.value) nodesInput.value = walletAddress;
  if (walletAddress) loadNodes(walletAddress, true);
  return walletAddress;
}
async function waitForTransaction(hash) {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const receipt = await window.ethereum.request({ method: 'eth_getTransactionReceipt', params: [hash] });
    if (receipt) return receipt.status === '0x1';
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}
function validContractAddress(address) { return /^0x[a-fA-F0-9]{40}$/.test(address || ''); }
function mintedTokenId(receipt) {
  const log = (receipt.logs || []).find(item => item.topics?.[0]?.toLowerCase() === TOKEN_TRANSFER_TOPIC && item.address?.toLowerCase() === NFT_CONTRACT_ADDRESS.toLowerCase());
  return log?.topics?.[3] ? Number(BigInt(log.topics[3])) : null;
}
async function mintOnChain(editionIndex) {
  try {
    if (!contractsReady()) throw new Error('Kontrak belum dikonfigurasi — alamat PokepvpNode diisi setelah owner men-deploy.');
    if (!walletAddress) await connectWallet();
    await ensureBnbMainnet();
    const from = walletAddress || (await window.ethereum.request({ method: 'eth_accounts' }))[0];
    if (!from) throw new Error('Hubungkan wallet terlebih dahulu.');
    const edition = EDITIONS[editionIndex];
    const open = await readBool(NFT_CONTRACT_ADDRESS, SEL.mintOpen).catch(() => true);
    if (!open) throw new Error('Mint sedang ditutup oleh owner.');
    if (editionIndex === 0) {
      const used = await readBool(NFT_CONTRACT_ADDRESS, SEL.freeUsed + encAddress(from)).catch(() => false);
      if (used) throw new Error('Starter gratis sudah pernah di-mint dari wallet ini (maks 1 per wallet). Pilih edisi berbayar.');
    }
    const data = SEL.mint + encUint(editionIndex);
    const value = '0x' + BigInt(edition.priceWei).toString(16);
    showToast(editionIndex === 0 ? 'Konfirmasi mint Starter gratis di wallet…' : `Konfirmasi mint ${edition.name} · ${edition.priceBNB} BNB di wallet…`);
    const hash = await window.ethereum.request({ method: 'eth_sendTransaction', params: [{ from, to: NFT_CONTRACT_ADDRESS, value, data, gas: '0x927c0' }] });
    setWalletButton(shortenAddress(from));
    showToast('Mint dikirim — menunggu konfirmasi blockchain');
    const receipt = await waitForReceipt(hash);
    if (!receipt || receipt.status !== '0x1') throw new Error('Transaksi mint gagal atau dibatalkan.');
    return { hash, tokenId: mintedTokenId(receipt) };
  } catch (error) {
    showToast(error?.message || 'Mint dibatalkan');
    return null;
  }
}
async function waitForReceipt(hash) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const receipt = await window.ethereum.request({ method: 'eth_getTransactionReceipt', params: [hash] });
    if (receipt) return receipt;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Konfirmasi blockchain terlalu lama. Cek hash transaksi di BscScan.');
}
function renderAll() {
  const selected = getSelected();
  document.querySelector('#heroCard').innerHTML = cardMarkup(cards[0]);
  document.querySelector('#collectionGrid').innerHTML = cards.map(card => `<div class="collection-card ${card.id === selectedId ? 'selected' : ''}" data-card-id="${card.id}">${cardMarkup(card)}</div>`).join('');
  document.querySelector('#selectionArt').innerHTML = creatureSvg(selected.tone, selected.evolved);
  document.querySelector('#selectionCode').textContent = String(selected.id).padStart(3, '0');
  document.querySelector('#selectionRarity').textContent = selected.rarity;
  document.querySelector('#selectionName').textContent = selected.name;
  document.querySelector('#selectionDesc').textContent = selected.desc;
  document.querySelector('#selectionPower').textContent = selected.power;
  document.querySelector('#selectionLevel').textContent = String(selected.level).padStart(2, '0');
  document.querySelector('#selectionType').textContent = selected.type;
  document.querySelector('#upgradeMiniCard').innerHTML = cardMarkup(selected, true);
  const nextLevel = Math.min(selected.level + 1, maxLevel);
  const willEvolve = !selected.evolved && nextLevel >= selected.evolveAt;
  const nextPower = selected.level >= maxLevel ? selected.power : selected.power + (willEvolve ? 28 : 16);
  document.querySelector('#upgradeNextCard').innerHTML = cardMarkup({ ...selected, level: nextLevel, power: nextPower, status: selected.level >= maxLevel ? 'MAX LEVEL' : willEvolve ? 'EVOLUTION READY' : 'NEXT STATE', evolved: selected.evolved || willEvolve }, true);
  document.querySelector('#upgradeLevel').textContent = selected.level >= maxLevel ? '10 · MAX' : `${String(selected.level).padStart(2, '0')} → ${String(nextLevel).padStart(2, '0')}`;
  document.querySelector('#upgradePower').textContent = selected.level >= maxLevel ? `${selected.power} · CAPPED` : `${selected.power} → ${nextPower}`;
  document.querySelector('#evolutionStatus').innerHTML = selected.level >= maxLevel ? '<span>LEVEL CAP</span><strong>LV 10 · MAX LEVEL</strong><small>This NFT has reached the arena ceiling.</small>' : selected.evolved ? '<span>FORM PATH</span><strong>ASCENDED FORM UNLOCKED</strong><small>New silhouette, aura, crest, and premium finish active.</small>' : `<span>FORM PATH · LV ${selected.evolveAt}</span><strong>BASE → ASCENDED</strong><small>Next evolution unlocks at level ${selected.evolveAt}.</small>`;
  const upgradeButton = document.querySelector('#upgradeButton');
  upgradeButton.disabled = selected.level >= maxLevel;
  upgradeButton.innerHTML = selected.level >= maxLevel ? 'Maximum level reached <span>✓</span>' : 'Preview level up <span>↗</span>';
  document.querySelector('#duelPlayer').innerHTML = cardMarkup(selected, true);
  document.querySelector('#duelOpponent').innerHTML = cardMarkup(opponent, true, true);
  document.querySelector('#cardCount').textContent = String(cards.length).padStart(2, '0');
  const supplyByRarity = ['COMMON', 'RARE', 'LEGENDARY'].reduce((result, rarity) => { result[rarity] = cards.filter(card => card.rarity === rarity).reduce((sum, card) => sum + card.supply, 0); return result; }, {});
  const mintedByRarity = ['COMMON', 'RARE', 'LEGENDARY'].reduce((result, rarity) => { result[rarity] = cards.filter(card => card.rarity === rarity).reduce((sum, card) => sum + card.minted, 0); return result; }, {});
  ['common', 'rare', 'legendary'].forEach(rarity => { document.querySelector(`#supply-${rarity}`).textContent = `${mintedByRarity[rarity.toUpperCase()]}/${supplyByRarity[rarity.toUpperCase()]}`; });
  document.querySelector('#materialCount').textContent = String(material).padStart(2, '0');
  document.querySelectorAll('[data-card-id]').forEach(el => el.addEventListener('click', () => { selectedId = Number(el.dataset.cardId); renderAll(); showToast(`${getSelected().name} is now your active card`); }));
}
let currentNodesAddress = '';
let nodesRefreshBusy = false;

async function refreshChainStats() {
  const rail = document.querySelector('#railState');
  if (!contractsReady()) { if (rail) rail.textContent = 'Contract not configured yet'; return; }
  try {
    const [minted, eraNow, totalRate] = await Promise.all([
      readUint(NFT_CONTRACT_ADDRESS, SEL.totalMinted),
      readUint(NFT_CONTRACT_ADDRESS, SEL.era),
      readUint(NFT_CONTRACT_ADDRESS, SEL.totalHashRate)
    ]);
    document.querySelector('#heroMinted').textContent = minted.toString();
    document.querySelector('#statEra').textContent = `Era ${eraNow.toString()}`;
    document.querySelector('#statHashRate').textContent = `${formatPVP(totalRate)} $PVP`;
    document.querySelector('#statMinted').textContent = `${minted.toString()} / 10,000`;
    if (rail) rail.textContent = 'Arena systems nominal';
    const token = await resolveTokenAddress();
    if (token) {
      const pool = await readUint(token, SEL.balanceOf + encAddress(NFT_CONTRACT_ADDRESS));
      document.querySelector('#statPool').textContent = `${formatPVP(pool)} $PVP`;
      if (walletAddress) {
        const mine = await readUint(token, SEL.balanceOf + encAddress(walletAddress));
        document.querySelector('#myPvpBalance').textContent = `${formatPVP(mine)} $PVP`;
      }
    }
  } catch { if (rail) rail.textContent = 'Contract read failed — will retry'; }
}

async function refreshMintButtons() {
  const starterBtn = document.querySelector('[data-mint-edition="0"]');
  if (!starterBtn) return;
  if (!contractsReady() || !walletAddress) { starterBtn.disabled = false; starterBtn.innerHTML = 'Mint Starter — free <span>↗</span>'; return; }
  try {
    const used = await readBool(NFT_CONTRACT_ADDRESS, SEL.freeUsed + encAddress(walletAddress));
    starterBtn.disabled = used;
    starterBtn.innerHTML = used ? 'Starter claimed ✓ <span>1/1</span>' : 'Mint Starter — free <span>↗</span>';
  } catch { /* biarkan tombol aktif bila bacaan gagal */ }
}

async function loadNodes(address, silent = false) {
  const list = document.querySelector('#nodesList');
  if (!list) return;
  if (!contractsReady()) { list.innerHTML = '<p class="nodes-empty">Contract not configured yet — node data appears after the owner deploys PokepvpNode.</p>'; return; }
  if (!validContractAddress(address)) { if (!silent) showToast('Alamat wallet tidak valid'); return; }
  if (nodesRefreshBusy && silent) return;
  nodesRefreshBusy = true;
  currentNodesAddress = address;
  try {
    const ids = await readUintArray(NFT_CONTRACT_ADDRESS, SEL.tokensOfOwner + encAddress(address));
    document.querySelector('#nodesCount').textContent = String(ids.length);
    if (!ids.length) {
      list.innerHTML = '<p class="nodes-empty">No nodes found for this address yet — mint one in the Mint Lab above.</p>';
      document.querySelector('#nodesPending').textContent = '0 $PVP';
      return;
    }
    let totalPending = 0n;
    const rows = [];
    for (const id of ids) {
      const [ed, rate, pending] = await Promise.all([
        readUint(NFT_CONTRACT_ADDRESS, SEL.editionOf + encUint(id)),
        readUint(NFT_CONTRACT_ADDRESS, SEL.hashRateOf + encUint(id)),
        readUint(NFT_CONTRACT_ADDRESS, SEL.pendingOf + encUint(id))
      ]);
      totalPending += pending;
      const edition = EDITIONS[Number(ed)] || EDITIONS[0];
      rows.push(`<div class="node-row"><div class="node-main"><b>Node #${id}</b><span class="node-edition">${edition.name}</span></div><div class="node-stat"><span>HASH RATE</span><b>${formatPVP(rate)} $PVP/day</b></div><div class="node-stat"><span>PENDING</span><b>${formatPVP(pending)} $PVP</b></div><button class="button button-gold node-claim" data-claim="${id}" ${pending === 0n ? 'disabled' : ''}>Claim</button></div>`);
    }
    list.innerHTML = rows.join('');
    document.querySelector('#nodesPending').textContent = `${formatPVP(totalPending)} $PVP`;
    const token = await resolveTokenAddress();
    if (token) {
      const mine = await readUint(token, SEL.balanceOf + encAddress(address));
      document.querySelector('#myPvpBalance').textContent = `${formatPVP(mine)} $PVP`;
    }
  } catch (error) {
    if (!silent) showToast(error?.message || 'Gagal membaca nodes');
  } finally { nodesRefreshBusy = false; }
}

async function claimNode(tokenId) {
  try {
    if (!contractsReady()) throw new Error('Kontrak belum dikonfigurasi.');
    if (!walletAddress) await connectWallet();
    await ensureBnbMainnet();
    if (!currentNodesAddress || !walletAddress || walletAddress.toLowerCase() !== currentNodesAddress.toLowerCase()) throw new Error('Hubungkan wallet pemilik node ini untuk klaim.');
    showToast(`Konfirmasi klaim Node #${tokenId} di wallet…`);
    const hash = await window.ethereum.request({ method: 'eth_sendTransaction', params: [{ from: walletAddress, to: NFT_CONTRACT_ADDRESS, value: '0x0', data: SEL.claim + encUint(tokenId) }] });
    showToast('Klaim dikirim — menunggu konfirmasi blockchain');
    const receipt = await waitForReceipt(hash);
    if (!receipt || receipt.status !== '0x1') throw new Error('Transaksi klaim gagal atau dibatalkan.');
    showToast(`Yield Node #${tokenId} berhasil diklaim`);
    loadNodes(currentNodesAddress, true);
    refreshChainStats();
  } catch (error) { showToast(error?.message || 'Klaim dibatalkan'); }
}

async function claimAllNodes() {
  if (!currentNodesAddress) { showToast('Muat nodes dulu sebelum klaim massal'); return; }
  const buttons = [...document.querySelectorAll('[data-claim]')].filter(b => !b.disabled);
  if (!buttons.length) { showToast('Tidak ada yield yang bisa diklaim saat ini'); return; }
  for (const b of buttons) { await claimNode(Number(b.dataset.claim)); }
}

function buildAgentPrompt(editionIndex) {
  const edition = EDITIONS[editionIndex];
  const address = contractsReady() ? NFT_CONTRACT_ADDRESS : '<POKEPVP_NODE_CONTRACT_ADDRESS — filled in after deployment>';
  const starterCheck = editionIndex === 0 ? 'freeUsed(your wallet) = false, ' : '';
  const valueNote = editionIndex === 0 ? 'Starter is free: send exactly 0 BNB (gas only).' : 'Send exactly that amount — the full edition price, nothing extra.';
  return `Mint 1 Pokepvp Creature NFT on BNB Chain — edition ${editionIndex} (${edition.name}).
Contract: ${address}.
First check on-chain: mintOpen() = true, ${starterCheck}and editionPrice(${editionIndex}) = ${edition.priceBNB} BNB.
If any check fails, stop and tell me — never switch editions or pay a different amount.
Then call mint(${editionIndex}) with exactly ${edition.priceBNB} BNB as the transaction value, gasLimit 600000. ${valueNote}
The node mines ${edition.ratePerDay} $PVP per day from the moment it is minted; claim mined $PVP any time with claim(tokenId).
Do it now — no preview needed. Reply with the transaction link when done.`;
}
function currentAgentPrompt() { const sel = document.querySelector('#promptEdition'); return buildAgentPrompt(sel ? Number(sel.value) : 1); }
function renderAgentPrompt() { const el = document.querySelector('#agentPromptText'); if (el) el.textContent = currentAgentPrompt(); }


function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2300); }
function openReveal(card, edition, tokenId) { pendingCard = card; document.querySelector('#revealCard').innerHTML = cardMarkup(card); document.querySelector('#revealEdition').textContent = edition ? `${edition.name} edition · mines ${edition.ratePerDay.toLocaleString('en-US')} $PVP/day${tokenId == null ? '' : ` · Token #${tokenId}`}` : ''; const modal = document.querySelector('#revealModal'); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); }
function closeReveal() { const modal = document.querySelector('#revealModal'); modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
async function mint(editionIndex) {
  const edition = EDITIONS[editionIndex];
  const result = await mintOnChain(editionIndex);
  if (!result) return;
  const template = cards[Math.floor(Math.random() * cards.length)];
  const roll = { ...template, id: Math.max(...cards.map(c => c.id)) + 1, level: 1, power: Math.max(30, template.power - 20), status: result.tokenId == null ? 'MINTED ON-CHAIN' : `TOKEN #${result.tokenId}`, txHash: result.hash, tokenId: result.tokenId, edition: editionIndex };
  openReveal(roll, edition, result.tokenId);
  showToast(`NFT asli berhasil dicetak${result.tokenId == null ? '' : ` · token #${result.tokenId}`} · edisi ${edition.name}`);
  refreshChainStats();
  refreshMintButtons();
  if (currentNodesAddress && walletAddress && currentNodesAddress.toLowerCase() === walletAddress.toLowerCase()) loadNodes(currentNodesAddress, true);
}

document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  document.querySelector('#connectWallet').addEventListener('click', () => connectWallet().catch(error => showToast(error.message)));
  if (window.ethereum) {
    window.ethereum.on?.('accountsChanged', accounts => { walletAddress = accounts[0] || null; setWalletButton(walletAddress ? shortenAddress(walletAddress) : 'Connect wallet'); refreshMintButtons(); const ni = document.querySelector('#nodesAddress'); if (ni && walletAddress) { ni.value = walletAddress; loadNodes(walletAddress, true); } });
    window.ethereum.on?.('chainChanged', () => { walletAddress = null; setWalletButton('Switch to BNB'); showToast('Network changed — pilih BNB Mainnet'); });
  }
  document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' })));
  document.querySelectorAll('[data-mint-edition]').forEach(button => button.addEventListener('click', () => mint(Number(button.dataset.mintEdition))));
  document.querySelector('#promptEdition')?.addEventListener('change', renderAgentPrompt);
  renderAgentPrompt();
  document.querySelector('#loadNodesBtn')?.addEventListener('click', () => loadNodes((document.querySelector('#nodesAddress').value || '').trim()));
  document.querySelector('#claimAllBtn')?.addEventListener('click', claimAllNodes);
  document.querySelector('#nodesList')?.addEventListener('click', event => { const btn = event.target.closest('[data-claim]'); if (btn && !btn.disabled) claimNode(Number(btn.dataset.claim)); });
  refreshChainStats();
  refreshMintButtons();
  setInterval(() => { refreshChainStats(); refreshMintButtons(); if (currentNodesAddress) loadNodes(currentNodesAddress, true); }, 30000);
  document.querySelector('#promptButton').addEventListener('click', () => copyPrompt());
  document.querySelector('#copyPrompt').addEventListener('click', () => copyPrompt());
  document.querySelector('#closeModal').addEventListener('click', closeReveal);
  document.querySelector('#revealModal').addEventListener('click', event => { if (event.target.id === 'revealModal') closeReveal(); });
  document.querySelector('#claimReveal').addEventListener('click', () => { if (!pendingCard) return; cards.push(pendingCard); selectedId = pendingCard.id; closeReveal(); renderAll(); showToast(`${pendingCard.name} added to your collection`); pendingCard = null; });
  document.querySelector('#upgradeButton').addEventListener('click', () => {
    const selected = getSelected();
    if (selected.level >= maxLevel) { showToast('This card is already at the level cap (simulation).'); return; }
    if (material < 1) { showToast('Simulation material habis — level up tidak bisa dilanjutkan.'); return; }
    material -= 1;
    const willEvolve = !selected.evolved && selected.level + 1 >= selected.evolveAt;
    selected.level += 1;
    selected.power += willEvolve ? 28 : 16;
    if (willEvolve) { selected.evolved = true; selected.status = 'ASCENDED FORM'; }
    renderAll();
    showToast(`${selected.name} naik ke LV ${selected.level} — simulasi lokal, tidak ada BNB yang dikirim.`);
  });
  document.querySelector('#duelButton').addEventListener('click', () => { const selected = getSelected(); const result = document.querySelector('#duelResult'); const win = selected.power >= opponent.power; result.className = `duel-result ${win ? 'win' : 'loss'}`; result.innerHTML = `<span class="result-dot"></span><p>${win ? `${selected.name} takes the round — ${selected.power} power beats ${opponent.power}.` : `${opponent.name} holds the line — add power before the rematch.`}</p>`; showToast(win ? 'Duel result: victory' : 'Duel result: rival wins'); });
});

async function copyPrompt() { const value = currentAgentPrompt(); try { await navigator.clipboard.writeText(value); showToast('Agent prompt copied'); } catch { showToast(value); } }
