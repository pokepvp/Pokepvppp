const cards = [
  { id: 1, name: 'Voltari', type: 'ARC', rarity: 'LEGENDARY', level: 7, power: 86, tone: 'voltari', evolveAt: 8, evolved: false, supply: 100, desc: 'A neon-charged runner that turns pressure into momentum.', status: 'READY TO DUEL', accent: 'gold' },
  { id: 2, name: 'Emberlyn', type: 'FLARE', rarity: 'RARE', level: 4, power: 63, tone: 'emberlyn', evolveAt: 6, evolved: false, supply: 400, desc: 'A quick-footed spark with a talent for sudden comebacks.', status: 'CHARGE 82%', accent: 'coral' },
  { id: 3, name: 'Mossbyte', type: 'GROVE', rarity: 'COMMON', level: 2, power: 41, tone: 'mossbyte', evolveAt: 5, evolved: false, supply: 2000, desc: 'Small, stubborn, and stronger every time it takes a hit.', status: 'GROWING', accent: 'mint' },
  { id: 4, name: 'Stonefin', type: 'TIDE', rarity: 'COMMON', level: 3, power: 38, tone: 'stonefin', evolveAt: 5, evolved: false, supply: 2000, desc: 'A patient river guardian with a surprisingly hard shell.', status: 'GROWING', accent: 'blue' },
  { id: 5, name: 'Frostbyte', type: 'GLACIER', rarity: 'RARE', level: 5, power: 69, tone: 'frostbyte', evolveAt: 6, evolved: false, supply: 400, desc: 'A cold-blooded tactician that freezes the tempo of a duel.', status: 'CHARGE 91%', accent: 'purple' },
  { id: 6, name: 'Pyrodrake', type: 'INFERNO', rarity: 'LEGENDARY', level: 8, power: 94, tone: 'pyrodrake', evolveAt: 10, evolved: false, supply: 100, desc: 'A sky-borne flare that turns every entrance into a finisher.', status: 'READY TO DUEL', accent: 'coral' },
  { id: 7, name: 'Pebblit', type: 'STONE', rarity: 'COMMON', level: 1, power: 29, tone: 'stonefin', evolveAt: 5, evolved: false, supply: 2000, desc: 'A tiny shield-bearer that learns through every impact.', status: 'GROWING', accent: 'blue' },
  { id: 8, name: 'Bloomox', type: 'BLOOM', rarity: 'COMMON', level: 3, power: 45, tone: 'mossbyte', evolveAt: 5, evolved: false, supply: 2000, desc: 'A gentle forest brute with a hidden second wind.', status: 'GROWING', accent: 'mint' },
  { id: 9, name: 'Aurorix', type: 'AURORA', rarity: 'RARE', level: 6, power: 74, tone: 'frostbyte', evolveAt: 8, evolved: false, supply: 400, desc: 'A prism-winged scout that predicts the next move.', status: 'CHARGE 68%', accent: 'purple' },
  { id: 10, name: 'Cinderclaw', type: 'EMBER', rarity: 'RARE', level: 5, power: 67, tone: 'emberlyn', evolveAt: 7, evolved: false, supply: 400, desc: 'A hot-headed striker that never gives the lead back.', status: 'CHARGE 76%', accent: 'coral' },
  { id: 11, name: 'Solvyr', type: 'CELESTIAL', rarity: 'LEGENDARY', level: 9, power: 98, tone: 'pyrodrake', evolveAt: 10, evolved: false, supply: 100, desc: 'A solar apex creature reserved for the sharpest collectors.', status: 'APEX READY', accent: 'gold' },
  { id: 12, name: 'Noctyra', type: 'ECLIPSE', rarity: 'LEGENDARY', level: 8, power: 91, tone: 'gravemaw', evolveAt: 10, evolved: false, supply: 100, desc: 'A silent eclipse that turns a crowded arena completely still.', status: 'APEX READY', accent: 'purple' }
];
const opponent = { id: 99, name: 'Gravemaw', type: 'VOID', rarity: 'RARE', level: 5, power: 72, tone: 'gravemaw', desc: 'A heavy signal hiding a precise counter.', status: 'RIVAL SIGNAL', accent: 'purple' };
let selectedId = 1;
let sortByPower = false;
let pendingCard = null;
// Card progress from level-ups persists in this browser.
try { const prog = JSON.parse(localStorage.getItem('pokepvp_progress_v1') || '[]'); for (const p of prog) { const c = cards.find(x => x.id === p.id); if (c) { c.level = p.level; c.power = p.power; c.evolved = p.evolved; c.status = p.status; } } } catch { /* no saved progress */ }
function saveProgress() { try { localStorage.setItem('pokepvp_progress_v1', JSON.stringify(cards.map(c => ({ id: c.id, level: c.level, power: c.power, evolved: c.evolved, status: c.status })))); } catch { /* storage unavailable */ } }
const maxLevel = 10;
// ── Contract configuration ──────────────────────────────────────────
// Addresses are filled in AFTER the owner deploys both contracts via deploy.html.
// While empty (""), the site shows a "contract not configured yet" status
// and every on-chain read is skipped safely — nothing errors out.
const POKEPVP_CONFIG = {
  nftAddress: "0xFe565C3Dda51eC386263d3955e5455123A50477f", // PokepvpNode (NFT) — deployed 2026-11-04
  tokenAddress: "0x1687cfcA05CD3a8Ef2b4600A7De0531D305A18C4", // PvpToken ($PVP) — deployed 2026-11-04
  chainId: "0x38"   // BNB Smart Chain Mainnet
};
const NFT_CONTRACT_ADDRESS = POKEPVP_CONFIG.nftAddress || window.POKEPVP_NFT_ADDRESS || "";
const TOKEN_CONTRACT_ADDRESS = POKEPVP_CONFIG.tokenAddress || "";
const BNB_MAINNET_CHAIN_ID = POKEPVP_CONFIG.chainId;
// The five PokepvpNode editions. The edition is determined by the price paid — never random.
// priceWei must exactly match editionPrice in the contract.
const EDITIONS = [
  { name: "Starter", priceWei: "0",               priceBNB: "0",        ratePerDay: 10 },
  { name: "Bronze",  priceWei: "284000000000000", priceBNB: "0.000284", ratePerDay: 50 },
  { name: "Silver",  priceWei: "709000000000000", priceBNB: "0.000709", ratePerDay: 200 },
  { name: "Gold",    priceWei: "1420000000000000", priceBNB: "0.00142", ratePerDay: 600 },
  { name: "Diamond", priceWei: "4260000000000000", priceBNB: "0.00426", ratePerDay: 1500 }
];
// Contract function selectors (first 4 bytes of keccak).
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
  eraShares: "0x5fb471d6",     // eraShares()
  eraStarts: "0xf64d39a9",     // eraStarts(uint256)
  tokensOfOwner: "0x8462151c", // tokensOfOwner(address)
  pvpToken: "0x12bbb811",      // pvpToken()
  balanceOf: "0x70a08231"      // ERC-20 balanceOf(address)
};
const MINT_SELECTOR = SEL.mint;
const TOKEN_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
let walletAddress = null;

function contractsReady() { return validContractAddress(NFT_CONTRACT_ADDRESS); }
function pad32(hexNoPrefix) { return hexNoPrefix.padStart(64, '0'); }
function encAddress(address) { return pad32(String(address).toLowerCase().replace(/^0x/, '')); }
function encUint(value) { return pad32(BigInt(value).toString(16)); }
const BSC_RPC_URLS = [
  'https://bsc-dataseed.binance.org',
  'https://bsc-dataseed1.defibit.io',
  'https://bsc.publicnode.com',
  'https://bsc-dataseed2.binance.org',
  'https://bsc-dataseed3.binance.org'
];
let rpcIndex = 0;
async function fetchRpc(url, to, data) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to, data }, 'latest'] }), signal: ctrl.signal });
    if (!res.ok) throw new Error('RPC HTTP ' + res.status);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || 'RPC error');
    return json.result;
  } finally { clearTimeout(timer); }
}
async function ethCall(to, data) {
  if (window.ethereum) {
    try { return await window.ethereum.request({ method: 'eth_call', params: [{ to, data }, 'latest'] }); }
    catch { /* wallet provider failed the read - fall through to the public RPC pool */ }
  }
  let lastError = null;
  for (let attempt = 0; attempt < BSC_RPC_URLS.length; attempt++) {
    const idx = (rpcIndex + attempt) % BSC_RPC_URLS.length;
    try { const out = await fetchRpc(BSC_RPC_URLS[idx], to, data); rpcIndex = idx; return out; }
    catch (e) { lastError = e; }
  }
  throw lastError || new Error('All BSC RPC endpoints failed');
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
function paintTokenContract(addr) { const el = document.querySelector('#tokenContract'); if (el && addr) el.textContent = addr; paintVerifyLinks(); }
function paintVerifyLinks() { const foot = document.querySelector('#footerBscScan'); if (foot && contractsReady()) { foot.href = `https://bscscan.com/address/${NFT_CONTRACT_ADDRESS}`; foot.textContent = 'BscScan — contract'; foot.removeAttribute('aria-disabled'); } const el = document.querySelector('#verifyLinks'); if (!el) return; const parts = []; if (contractsReady()) parts.push(`<a href="https://bscscan.com/address/${NFT_CONTRACT_ADDRESS}#readContract" target="_blank" rel="noopener">NFT on BscScan</a>`); if (tokenAddressCache) parts.push(`<a href="https://bscscan.com/address/${tokenAddressCache}#readContract" target="_blank" rel="noopener">$PVP on BscScan</a>`); el.innerHTML = parts.length ? ' ' + parts.join(' · ') : ''; }
function paintNftContract() { const el = document.querySelector('#nftContract'); if (el && contractsReady()) el.textContent = NFT_CONTRACT_ADDRESS; paintVerifyLinks(); }
let tokenAddressCache = '';
async function resolveTokenAddress() {
  if (validContractAddress(TOKEN_CONTRACT_ADDRESS)) { paintTokenContract(TOKEN_CONTRACT_ADDRESS); return TOKEN_CONTRACT_ADDRESS; }
  if (tokenAddressCache) return tokenAddressCache;
  if (!contractsReady()) return '';
  try { const a = await readAddress(NFT_CONTRACT_ADDRESS, SEL.pvpToken); if (validContractAddress(a) && a.toLowerCase() !== '0x0000000000000000000000000000000000000000') { tokenAddressCache = a; paintTokenContract(a); } } catch { /* token not set on the contract yet */ }
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
    ${compact ? '' : `<div class="card-data"><div><span>RARITY</span><b>${card.rarity}</b></div><div><span>LEVEL</span><b>${String(card.level).padStart(2, '0')}</b></div><div><span>SUPPLY</span><b>${card.supply}</b></div></div>`}
    <div class="card-footer"><span>${card.status}</span><b>${opponentCard ? 'OPPONENT' : '● ACTIVE'}</b></div>
  </article>`;
}

function getSelected() { return cards.find(card => card.id === selectedId) || cards[0]; }
function shortenAddress(address) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }
function setWalletButton(label = 'Connect wallet') { const button = document.querySelector('#connectWallet'); if (button) button.textContent = label; }
async function ensureBnbMainnet() {
  if (!window.ethereum) throw new Error('MetaMask not found. Install MetaMask to pay with BNB.');
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (chainId === BNB_MAINNET_CHAIN_ID) return true;
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BNB_MAINNET_CHAIN_ID }] });
  } catch (error) {
    if (error.code !== 4902) throw new Error('Please select BNB Smart Chain Mainnet in MetaMask.');
    await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: BNB_MAINNET_CHAIN_ID, chainName: 'BNB Smart Chain Mainnet', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: ['https://bsc-dataseed.binance.org/'], blockExplorerUrls: ['https://bscscan.com'] }] });
  }
  return true;
}
async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask not found. Install MetaMask to connect your wallet.');
  await ensureBnbMainnet();
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  walletAddress = accounts[0] || null;
  setWalletButton(walletAddress ? shortenAddress(walletAddress) : 'Connect wallet');
  showToast(walletAddress ? `Wallet connected: ${shortenAddress(walletAddress)}` : 'No wallet selected');
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
    if (!contractsReady()) throw new Error('Contract not configured yet — the PokepvpNode address is added after the owner deploys.');
    if (!walletAddress) await connectWallet();
    await ensureBnbMainnet();
    const from = walletAddress || (await window.ethereum.request({ method: 'eth_accounts' }))[0];
    if (!from) throw new Error('Connect your wallet first.');
    const edition = EDITIONS[editionIndex];
    const open = await readBool(NFT_CONTRACT_ADDRESS, SEL.mintOpen).catch(() => true);
    if (!open) throw new Error('Mint is currently closed by the owner.');
    if (editionIndex === 0) {
      const used = await readBool(NFT_CONTRACT_ADDRESS, SEL.freeUsed + encAddress(from)).catch(() => false);
      if (used) throw new Error('The free Starter was already minted from this wallet (max 1 per wallet). Choose a paid edition.');
    }
    const data = SEL.mint + encUint(editionIndex);
    const value = '0x' + BigInt(edition.priceWei).toString(16);
    showToast(editionIndex === 0 ? 'Confirm the free Starter mint in your wallet…' : `Confirm the ${edition.name} mint · ${edition.priceBNB} BNB in your wallet…`);
    const hash = await window.ethereum.request({ method: 'eth_sendTransaction', params: [{ from, to: NFT_CONTRACT_ADDRESS, value, data, gas: '0x927c0' }] });
    setWalletButton(shortenAddress(from));
    showToast('Mint sent — waiting for blockchain confirmation');
    const receipt = await waitForReceipt(hash);
    if (!receipt || receipt.status !== '0x1') throw new Error('Mint transaction failed or was cancelled.');
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
  throw new Error('Blockchain confirmation is taking too long. Check the transaction hash on BscScan.');
}
function renderAll() {
  const selected = getSelected();
  document.querySelector('#heroCard').innerHTML = cardMarkup(cards[0]);
  document.querySelector('#collectionGrid').innerHTML = (sortByPower ? [...cards].sort((a, b) => b.power - a.power) : cards).map(card => `<div class="collection-card ${card.id === selectedId ? 'selected' : ''}" data-card-id="${card.id}">${cardMarkup(card)}</div>`).join('');
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
  upgradeButton.innerHTML = selected.level >= maxLevel ? 'Maximum level reached <span>✓</span>' : 'Level up <span>↗</span>';
  document.querySelector('#duelPlayer').innerHTML = cardMarkup(selected, true);
  document.querySelector('#duelOpponent').innerHTML = cardMarkup(opponent, true, true);
  document.querySelector('#cardCount').textContent = String(cards.length).padStart(2, '0');
  const supplyByRarity = ['COMMON', 'RARE', 'LEGENDARY'].reduce((result, rarity) => { result[rarity] = cards.filter(card => card.rarity === rarity).reduce((sum, card) => sum + card.supply, 0); return result; }, {});
  ['common', 'rare', 'legendary'].forEach(rarity => { document.querySelector(`#supply-${rarity}`).textContent = supplyByRarity[rarity.toUpperCase()].toLocaleString('en-US'); });
  document.querySelectorAll('[data-card-id]').forEach(el => el.addEventListener('click', () => { selectedId = Number(el.dataset.cardId); renderAll(); showToast(`${getSelected().name} is now your active card`); }));
}
let currentNodesAddress = '';
let nodesRefreshBusy = false;

async function refreshChainStats() {
  const rail = document.querySelector('#railState');
  if (!contractsReady()) { if (rail) rail.textContent = 'Contract not configured yet'; return; }
  let okCount = 0;
  const paint = (sel, text) => { const el = document.querySelector(sel); if (el && text != null) el.textContent = text; };
  const jobs = [
    (async () => { const minted = await readUint(NFT_CONTRACT_ADDRESS, SEL.totalMinted); paint('#heroMinted', minted.toString()); paint('#statMinted', `${minted.toString()} / 10,000`); okCount++; })(),
    (async () => { const eraNow = await readUint(NFT_CONTRACT_ADDRESS, SEL.era); paint('#statEra', `Era ${eraNow.toString()}`); okCount++;
      try { const startTs = await readUint(NFT_CONTRACT_ADDRESS, SEL.eraStarts + encUint(eraNow - 1n)); const nowS = BigInt(Math.floor(Date.now() / 1000)); if (startTs > 0n && startTs <= nowS) { const end = new Date(Number(startTs + 2592000n) * 1000); paint('#statEraNote', `hash rate minted this era, of the 150,000 era cap \u00b7 era ${eraNow} ends by ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at the latest`); } } catch { /* era start not recorded yet */ }
    })(),
    (async () => { const totalRate = await readUint(NFT_CONTRACT_ADDRESS, SEL.totalHashRate); paint('#statHashRate', `${formatPVP(totalRate)} $PVP`); okCount++; })(),
    (async () => { const eraSharesNow = await readUint(NFT_CONTRACT_ADDRESS, SEL.eraShares); paint('#statEraProgress', `${formatPVP(eraSharesNow)} / 150,000`); okCount++; })()
  ];
  await Promise.allSettled(jobs);
  if (okCount > 0) { paintNftContract(); if (rail) rail.textContent = 'Arena systems nominal'; }
  try {
    const token = await resolveTokenAddress();
    if (token) {
      const pool = await readUint(token, SEL.balanceOf + encAddress(NFT_CONTRACT_ADDRESS));
      paint('#statPool', `${formatPVP(pool)} $PVP`); okCount++;
      if (walletAddress) { const mine = await readUint(token, SEL.balanceOf + encAddress(walletAddress)); paint('#myPvpBalance', `${formatPVP(mine)} $PVP`); }
    }
  } catch { /* pool readout is best-effort */ }
  if (okCount === 0 && rail) rail.textContent = 'Contract read failed \u2014 will retry';
}

async function refreshMintButtons() {
  const starterBtn = document.querySelector('[data-mint-edition="0"]');
  if (!starterBtn) return;
  if (!contractsReady() || !walletAddress) { starterBtn.disabled = false; starterBtn.innerHTML = 'Mint Starter — free <span>↗</span>'; return; }
  try {
    const used = await readBool(NFT_CONTRACT_ADDRESS, SEL.freeUsed + encAddress(walletAddress));
    starterBtn.disabled = used;
    starterBtn.innerHTML = used ? 'Starter claimed ✓ <span>1/1</span>' : 'Mint Starter — free <span>↗</span>';
  } catch { /* keep the button active if the read fails */ }
}

async function loadNodes(address, silent = false) {
  const list = document.querySelector('#nodesList');
  if (!list) return;
  if (!contractsReady()) { list.innerHTML = '<p class="nodes-empty">Contract not configured yet — node data appears after the owner deploys PokepvpNode.</p>'; return; }
  if (!validContractAddress(address)) { if (!silent) showToast('Invalid wallet address'); return; }
  if (nodesRefreshBusy && silent) return;
  nodesRefreshBusy = true;
  currentNodesAddress = address;
  try {
    const ids = await readUintArray(NFT_CONTRACT_ADDRESS, SEL.tokensOfOwner + encAddress(address));
    document.querySelector('#nodesCount').textContent = String(ids.length);
    if (!ids.length) {
      list.innerHTML = '<p class="nodes-empty">No nodes found for this address yet — mint one in the Mint Lab above.</p>';
      document.querySelector('#nodesPending').textContent = '0 $PVP';
      document.querySelector('#nodesRate').textContent = '0 $PVP/day';
      return;
    }
    let totalPending = 0n;
    let totalRate = 0n;
    const rows = [];
    for (const id of ids) {
      const [ed, rate, pending] = await Promise.all([
        readUint(NFT_CONTRACT_ADDRESS, SEL.editionOf + encUint(id)),
        readUint(NFT_CONTRACT_ADDRESS, SEL.hashRateOf + encUint(id)),
        readUint(NFT_CONTRACT_ADDRESS, SEL.pendingOf + encUint(id))
      ]);
      totalPending += pending;
      totalRate += rate;
      const edition = EDITIONS[Number(ed)] || EDITIONS[0];
      rows.push(`<div class="node-row"><div class="node-main"><b>Node #${id}</b><span class="node-edition">${edition.name}</span></div><div class="node-stat"><span>HASH RATE</span><b>${formatPVP(rate)} $PVP/day</b></div><div class="node-stat"><span>PENDING</span><b>${formatPVP(pending)} $PVP</b></div><button class="button button-gold node-claim" data-claim="${id}" ${pending === 0n ? 'disabled' : ''}>Claim</button></div>`);
    }
    list.innerHTML = rows.join('');
    document.querySelector('#nodesPending').textContent = `${formatPVP(totalPending)} $PVP`;
    document.querySelector('#nodesRate').textContent = `${formatPVP(totalRate)} $PVP/day`;
    const token = await resolveTokenAddress();
    if (token) {
      const mine = await readUint(token, SEL.balanceOf + encAddress(address));
      document.querySelector('#myPvpBalance').textContent = `${formatPVP(mine)} $PVP`;
    }
  } catch (error) {
    if (!silent) showToast(error?.message || 'Failed to load nodes');
  } finally { nodesRefreshBusy = false; }
}

async function claimNode(tokenId) {
  try {
    if (!contractsReady()) throw new Error('Contract not configured yet.');
    if (!walletAddress) await connectWallet();
    await ensureBnbMainnet();
    if (!currentNodesAddress || !walletAddress || walletAddress.toLowerCase() !== currentNodesAddress.toLowerCase()) throw new Error('Connect the wallet that owns this node to claim.');
    showToast(`Confirm the claim for Node #${tokenId} in your wallet…`);
    const hash = await window.ethereum.request({ method: 'eth_sendTransaction', params: [{ from: walletAddress, to: NFT_CONTRACT_ADDRESS, value: '0x0', data: SEL.claim + encUint(tokenId) }] });
    showToast('Claim sent — waiting for blockchain confirmation');
    const receipt = await waitForReceipt(hash);
    if (!receipt || receipt.status !== '0x1') throw new Error('Claim transaction failed or was cancelled.');
    showToast(`Node #${tokenId} yield claimed`);
    loadNodes(currentNodesAddress, true);
    refreshChainStats();
  } catch (error) { showToast(error?.message || 'Claim cancelled'); }
}

async function claimAllNodes() {
  if (!currentNodesAddress) { showToast('Load your nodes before claiming all'); return; }
  const buttons = [...document.querySelectorAll('[data-claim]')].filter(b => !b.disabled);
  if (!buttons.length) { showToast('No yield available to claim right now'); return; }
  for (const b of buttons) { await claimNode(Number(b.dataset.claim)); }
}

function buildAgentPrompt(editionIndex) {
  const edition = EDITIONS[editionIndex];
  const address = contractsReady() ? NFT_CONTRACT_ADDRESS : '<POKEPVP_NODE_CONTRACT_ADDRESS \u2014 filled in after deployment>';
  const priceText = editionIndex === 0 ? 'FREE' : `${edition.priceBNB} BNB`;
  const checks = editionIndex === 0
    ? 'mintOpen()=true · freeUsed(you)=false'
    : `mintOpen()=true · editionPrice(${editionIndex})=${edition.priceWei} wei`;
  return `Mint 1 Pokepvp NFT — ${edition.name} (${priceText}) — BNB Chain (56).
Contract: ${address}
Call mint(${editionIndex}) · selector 0x6ecd2306 · value ${edition.priceWei} wei (${edition.priceBNB} BNB) · gasLimit 600000.
Check first: ${checks}. No approvals. It mines ${edition.ratePerDay} $PVP/day. Reply with the tx link only.`;
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
  showToast(`Real NFT minted${result.tokenId == null ? '' : ` · token #${result.tokenId}`} · ${edition.name} edition`);
  refreshChainStats();
  refreshMintButtons();
  if (currentNodesAddress && walletAddress && currentNodesAddress.toLowerCase() === walletAddress.toLowerCase()) loadNodes(currentNodesAddress, true);
}

document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  document.querySelector('#connectWallet').addEventListener('click', () => connectWallet().catch(error => showToast(error.message)));
  if (window.ethereum) {
    window.ethereum.on?.('accountsChanged', accounts => { walletAddress = accounts[0] || null; setWalletButton(walletAddress ? shortenAddress(walletAddress) : 'Connect wallet'); refreshMintButtons(); const ni = document.querySelector('#nodesAddress'); if (ni && walletAddress) { ni.value = walletAddress; loadNodes(walletAddress, true); } });
    window.ethereum.on?.('chainChanged', () => { walletAddress = null; setWalletButton('Switch to BNB'); showToast('Network changed — please select BNB Mainnet'); });
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
    if (selected.level >= maxLevel) { showToast('This card is already at the level cap.'); return; }
    const willEvolve = !selected.evolved && selected.level + 1 >= selected.evolveAt;
    selected.level += 1;
    selected.power += willEvolve ? 28 : 16;
    if (willEvolve) { selected.evolved = true; selected.status = 'ASCENDED FORM'; }
    saveProgress();
    renderAll();
    showToast(`${selected.name} reached LV ${selected.level}.`);
  });
  document.querySelectorAll('.filter-chip').forEach(chip => chip.addEventListener('click', () => { document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active')); chip.classList.add('active'); sortByPower = chip.dataset.sort === 'power'; renderAll(); }));
  document.querySelector('#duelButton').addEventListener('click', () => { const selected = getSelected(); const result = document.querySelector('#duelResult'); const win = selected.power >= opponent.power; result.className = `duel-result ${win ? 'win' : 'loss'}`; result.innerHTML = `<span class="result-dot"></span><p>${win ? `${selected.name} takes the round — ${selected.power} power beats ${opponent.power}.` : `${opponent.name} holds the line — add power before the rematch.`}</p>`; showToast(win ? 'Duel result: victory' : 'Duel result: rival wins'); });
});

async function copyPrompt() { const value = currentAgentPrompt(); try { await navigator.clipboard.writeText(value); showToast('Agent prompt copied'); } catch { showToast(value); } }

// Installable web app: register the service worker (network-first, cache is only an offline fallback).
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); }); }
// ── Live mint feed + Top Miners board ─────────────────────────────
// Both are built from plain eth_call reads — the same calls the rest
// of this page already makes — so they work wherever the stats do.
// The feed tracks the minted counter: new token IDs appear the moment
// totalMinted grows, with their owner and edition read on the spot.
// The board enumerates the latest BOARD_SCAN_CAP tokens with ownerOf
// (ground truth for current holders) and ranks wallets by summed
// hashRateOf. State is cached in localStorage between visits.
const OWNEROF_SEL = '0x6352211e'; // ownerOf(uint256)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const BOARD_SCAN_CAP = 600;
const liveState = { minted: 0, ownerOf: new Map(), mints: [], partial: false, busy: false };

function saveLiveCache() {
  try { localStorage.setItem('pokepvp_live_v2', JSON.stringify({ minted: liveState.minted, owners: Object.fromEntries(liveState.ownerOf), mints: liveState.mints.slice(-40) })); } catch { /* storage unavailable */ }
}
function loadLiveCache() {
  try {
    const raw = localStorage.getItem('pokepvp_live_v2');
    if (!raw) return;
    const j = JSON.parse(raw);
    if (typeof j.minted === 'number' && j.minted > 0) {
      liveState.minted = j.minted;
      liveState.ownerOf = new Map(Object.entries(j.owners || {}).map(([k, v]) => [Number(k), v]));
      liveState.mints = Array.isArray(j.mints) ? j.mints : [];
    }
  } catch { /* no usable cache */ }
}
async function refreshLiveData() {
  if (!contractsReady() || liveState.busy) return;
  liveState.busy = true;
  try {
    const total = Number(await readUint(NFT_CONTRACT_ADDRESS, SEL.totalMinted));
    if (total > 0 && liveState.mints.length === 0 && liveState.minted === 0) {
      for (let id = Math.max(1, total - 13); id <= total; id += 1) liveState.mints.push({ id, seen: null });
    } else if (total > liveState.minted) {
      for (let id = liveState.minted + 1; id <= total; id += 1) liveState.mints.push({ id, seen: Date.now() });
    }
    liveState.minted = total;
    if (liveState.mints.length > 40) liveState.mints = liveState.mints.slice(-40);
    liveState.partial = total > BOARD_SCAN_CAP;
    const start = Math.max(1, total - BOARD_SCAN_CAP + 1);
    const ids = [];
    for (let id = start; id <= total; id += 1) ids.push(id);
    for (let i = 0; i < ids.length; i += 12) {
      const batch = ids.slice(i, i + 12);
      const res = await Promise.allSettled(batch.map(id => readAddress(NFT_CONTRACT_ADDRESS, OWNEROF_SEL + encUint(id))));
      res.forEach((r, j) => { if (r.status === 'fulfilled' && validContractAddress(r.value) && r.value.toLowerCase() !== ZERO_ADDRESS) liveState.ownerOf.set(batch[j], r.value); });
    }
    for (const id of [...liveState.ownerOf.keys()]) if (id < start || id > total) liveState.ownerOf.delete(id);
    saveLiveCache();
  } catch { /* keep the last good render */ } finally { liveState.busy = false; }
}
const speciesNameCache = new Map();
async function speciesName(tokenId) {
  if (speciesNameCache.has(tokenId)) return speciesNameCache.get(tokenId);
  let name = 'Node';
  try {
    const res = await fetch('metadata/' + tokenId + '.json');
    if (res.ok) { const j = await res.json(); if (j && j.name) name = String(j.name).replace(/ #\d+$/, ''); }
  } catch { /* metadata unreachable - generic label */ }
  speciesNameCache.set(tokenId, name);
  return name;
}
function timeAgo(tsSec) {
  const s = Math.max(0, Math.floor(Date.now() / 1000) - tsSec);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
async function renderFeed() {
  const track = document.querySelector('#liveTrack');
  if (!track) return;
  const items = [...liveState.mints].slice(-14).reverse();
  if (!items.length) { track.innerHTML = '<span class="live-item muted">No mints yet — the next node could be yours.</span>'; return; }
  const parts = await Promise.all(items.map(async i => {
    const [ed, nm] = await Promise.all([
      readUint(NFT_CONTRACT_ADDRESS, SEL.editionOf + encUint(i.id)).catch(() => 0n),
      speciesName(i.id)
    ]);
    let owner = liveState.ownerOf.get(i.id);
    if (!owner) { try { owner = await readAddress(NFT_CONTRACT_ADDRESS, OWNEROF_SEL + encUint(i.id)); } catch { owner = ''; } }
    const edition = EDITIONS[Number(ed)] || EDITIONS[0];
    const who = owner && validContractAddress(owner) ? shortenAddress(owner) : 'A miner';
    const when = i.seen ? timeAgo(Math.floor(i.seen / 1000)) : 'recently';
    return `<span class="live-item"><b>${who}</b> minted <b class="live-ed ed-${Number(ed)}">${edition.name}</b> ${nm} #${i.id} <i>${when}</i></span>`;
  }));
  const html = parts.join('<span class="live-sep">✦</span>');
  track.innerHTML = html + '<span class="live-sep">✦</span>' + html + '<span class="live-sep">✦</span>';
}
async function renderBoard() {
  const list = document.querySelector('#boardList');
  if (!list) return;
  const note = document.querySelector('#boardNote');
  if (note) note.textContent = liveState.partial
    ? 'Holders of the latest 600 nodes, ranked by combined hash rate — read live from the contract.'
    : 'Current holders ranked by combined hash rate — read live from the contract.';
  const byWallet = new Map();
  for (const [id, addr] of liveState.ownerOf) { if (!byWallet.has(addr)) byWallet.set(addr, []); byWallet.get(addr).push(id); }
  const wallets = [...byWallet.entries()].map(([addr, ids]) => ({ addr, ids })).sort((a, b) => b.ids.length - a.ids.length).slice(0, 12);
  if (!wallets.length) {
    list.innerHTML = '<p class="nodes-empty">No nodes minted yet — the crown is unclaimed.</p>';
    const crown0 = document.querySelector('#boardCrown'); if (crown0) crown0.textContent = '—';
    return;
  }
  const rows = await Promise.all(wallets.map(async w => {
    let rate = 0n;
    const parts = await Promise.allSettled(w.ids.map(id => readUint(NFT_CONTRACT_ADDRESS, SEL.hashRateOf + encUint(id))));
    for (const p of parts) if (p.status === 'fulfilled') rate += p.value;
    return { addr: w.addr, ids: w.ids, rate };
  }));
  rows.sort((a, b) => (b.rate > a.rate ? 1 : b.rate < a.rate ? -1 : b.ids.length - a.ids.length));
  const crown = document.querySelector('#boardCrown');
  if (crown) crown.textContent = shortenAddress(rows[0].addr);
  list.innerHTML = rows.map((w, i) => {
    const you = walletAddress && w.addr.toLowerCase() === walletAddress.toLowerCase();
    return `<div class="board-row${i === 0 ? ' board-first' : ''}${you ? ' board-you' : ''}"><span class="board-rank">${i === 0 ? '👑' : '#' + (i + 1)}</span><span class="board-addr">${shortenAddress(w.addr)}${you ? ' <b class="you-chip">YOU</b>' : ''}</span><span class="board-nodes">${w.ids.length} node${w.ids.length === 1 ? '' : 's'}</span><span class="board-rate">${formatPVP(w.rate)} $PVP/day</span></div>`;
  }).join('');
}
async function refreshLive() { await refreshLiveData(); renderFeed(); renderBoard(); }
document.addEventListener('DOMContentLoaded', () => {
  loadLiveCache();
  if (contractsReady()) { refreshLive(); setInterval(refreshLive, 60000); }
});
