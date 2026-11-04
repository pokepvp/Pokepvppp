// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title Pokepvp Creature — mining Node NFTs on BNB Chain (ERC-721)
/// @notice A self-contained ERC-721 in the Agent Card house style (no
///         external imports). Each Node is minted in one of five editions;
///         the edition is set by the price paid, never by random rarity.
///         Every Node mines PVP tokens per second at its edition's hash
///         rate. Mining runs in eras: an era ends after 30 days or once
///         150,000 new shares (PVP/day of hash rate minted inside the era)
///         are in circulation, and at every boundary the yield halves.
///         There are at most 11 eras; after era 11 the multiplier stays
///         at the era-11 level (2^-10). Yield is paid out of this
///         contract's own PVP balance (the 600M mining reserve sent here
///         by PvpToken at its deployment).
contract PokepvpNode {
    // ---------- ERC-721 metadata ----------
    string public name = "Pokepvp Creature";
    string public symbol = "PKVP";

    // ---------- Ownership ----------
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ---------- Collection / mint state ----------
    uint256 public constant MAX_SUPPLY = 10_000;
    uint256 public totalMinted; // also the last issued token ID (IDs are sequential from 1)
    bool public mintOpen = false; // starts closed at deployment; the owner opens it with setMintOpen(true)

    // Editions: 0 Starter, 1 Bronze, 2 Silver, 3 Gold, 4 Diamond.
    // editionPrice is the exact BNB a mint of that edition must pay (wei).
    uint256[5] public editionPrice;
    // editionRate is the mining hash rate of that edition, in PVP wei/day.
    uint256[5] public editionRate;

    mapping(address => bool) public freeUsed; // Starter (edition 0): max 1 per wallet
    mapping(address => uint256) public mintCount;

    // ---------- Mining / era state ----------
    uint256 public constant ERA_DURATION = 30 days;
    uint256 public constant SHARES_PER_ERA = 150_000 ether; // PVP/day of new hash rate per era
    uint256 public constant MAX_ERA = 11;

    address public pvpToken; // set with setToken() after PvpToken is deployed
    string public baseURI;

    uint256 public storedEra; // last era recorded on-chain (see era() for the live value)
    uint256[] public eraStarts; // eraStarts[e - 1] = unix time era e began (recorded boundaries only)
    uint256 public totalHashRate; // sum of all minted tokens' rates, PVP wei/day
    uint256 public eraShares; // hash rate minted inside the current stored era, PVP wei/day

    struct NodeData {
        uint8 edition;
        uint256 lastUpdate; // last claim (or mint) time; accrual is measured from here
    }
    mapping(uint256 => NodeData) private _nodes;

    // ---------- ERC-721 storage ----------
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    // Per-owner token enumeration for the site.
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedIndex;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed tokenOwner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed tokenOwner, address indexed operator, bool approved);
    event NodeMinted(address indexed to, uint256 indexed tokenId, uint8 edition);
    event Claimed(uint256 indexed tokenId, address indexed to, uint256 amount);
    event EraAdvanced(uint256 indexed era, uint256 start);

    constructor() {
        owner = msg.sender;
        // Exact edition prices in BNB (Agentic Node schedule).
        editionPrice[0] = 0; // Starter: free, gas only
        editionPrice[1] = 0.000284 ether; // Bronze
        editionPrice[2] = 0.000709 ether; // Silver
        editionPrice[3] = 0.00142 ether; // Gold
        editionPrice[4] = 0.00426 ether; // Diamond
        // Hash rates in PVP per day.
        editionRate[0] = 10 ether;
        editionRate[1] = 50 ether;
        editionRate[2] = 200 ether;
        editionRate[3] = 600 ether;
        editionRate[4] = 1500 ether;
        storedEra = 1;
        eraStarts.push(block.timestamp);
    }

    // ---------- Minting ----------
    /// @notice Mint one Node of the chosen edition. Edition 0 (Starter) is
    ///         free (msg.value must be exactly 0) and limited to 1 per
    ///         wallet; paid editions require the exact edition price.
    function mint(uint8 edition) external payable returns (uint256 tokenId) {
        require(mintOpen, "Mint is closed");
        require(edition <= 4, "Bad edition");
        require(totalMinted < MAX_SUPPLY, "Sold out");
        require(msg.value == editionPrice[edition], "Exact price required");
        if (edition == 0) {
            require(!freeUsed[msg.sender], "Free mint used");
            freeUsed[msg.sender] = true;
        }
        _syncEras(); // settle any era boundary that passed before this mint
        tokenId = ++totalMinted;
        _nodes[tokenId] = NodeData(edition, block.timestamp);
        _owners[tokenId] = msg.sender;
        _balances[msg.sender] += 1;
        mintCount[msg.sender] += 1;
        _ownedIndex[tokenId] = _ownedTokens[msg.sender].length;
        _ownedTokens[msg.sender].push(tokenId);
        totalHashRate += editionRate[edition];
        eraShares += editionRate[edition];
        emit Transfer(address(0), msg.sender, tokenId);
        emit NodeMinted(msg.sender, tokenId, edition);
        _syncEras(); // this mint may have crossed the 150,000-share era boundary
    }

    // ---------- Mining ----------
    /// @notice PVP accrued by a token since its last claim, at the current
    ///         edition rates, halved at every era boundary in between.
    function pendingOf(uint256 tokenId) public view returns (uint256) {
        require(_owners[tokenId] != address(0), "Nonexistent token");
        NodeData storage n = _nodes[tokenId];
        uint256 rate = editionRate[n.edition];
        uint256 from = n.lastUpdate;
        uint256 to = block.timestamp;
        if (rate == 0 || to <= from) return 0;
        uint256 e = _eraAt(from);
        uint256 cursor = from;
        uint256 acc = 0;
        while (cursor < to) {
            uint256 segEnd = to;
            if (e < MAX_ERA) {
                uint256 nextBoundary = _eraStart(e + 1);
                if (nextBoundary < segEnd) segEnd = nextBoundary;
            }
            acc += (rate * (segEnd - cursor)) / (86400 * (uint256(1) << (e - 1)));
            cursor = segEnd;
            if (cursor < to) e++;
        }
        return acc;
    }

    /// @notice Claim a token's accrued PVP. Token owner only. Pays out of
    ///         this contract's PVP reserve balance.
    function claim(uint256 tokenId) external returns (uint256 amount) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(pvpToken != address(0), "Token not set");
        _syncEras();
        amount = pendingOf(tokenId);
        _nodes[tokenId].lastUpdate = block.timestamp;
        if (amount > 0) {
            require(IPvpToken(pvpToken).transfer(msg.sender, amount), "PVP transfer failed");
        }
        emit Claimed(tokenId, msg.sender, amount);
    }

    /// @notice Record any era boundary that has passed (time-based, or the
    ///         share threshold). Permissionless housekeeping; mint() and
    ///         claim() already call it internally.
    function pokeEra() external {
        _syncEras();
    }

    /// @notice The current era (1..11), computed live: the stored era plus
    ///         any whole 30-day periods that have elapsed since it began.
    function era() public view returns (uint256) {
        uint256 e = storedEra;
        uint256 start = eraStarts[e - 1];
        while (e < MAX_ERA && block.timestamp >= start + ERA_DURATION) {
            e++;
            start += ERA_DURATION;
        }
        return e;
    }

    function hashRateOf(uint256 tokenId) external view returns (uint256) {
        require(_owners[tokenId] != address(0), "Nonexistent token");
        return editionRate[_nodes[tokenId].edition];
    }

    function editionOf(uint256 tokenId) external view returns (uint8) {
        require(_owners[tokenId] != address(0), "Nonexistent token");
        return _nodes[tokenId].edition;
    }

    // ---------- Era internals ----------
    /// @dev Records era boundaries up to now. Share-triggered boundaries are
    ///      stamped with the time of the mint that crossed the threshold (a
    ///      mint calls this right after updating eraShares); time-triggered
    ///      boundaries are exact (previous start + 30 days). Because hash
    ///      rate only changes at mints, between two mints only time-based
    ///      boundaries can occur, so views can extend the recorded timeline
    ///      deterministically (see _eraStart).
    function _syncEras() internal {
        while (storedEra < MAX_ERA) {
            uint256 start = eraStarts[storedEra - 1];
            if (block.timestamp >= start + ERA_DURATION) {
                storedEra++;
                eraStarts.push(start + ERA_DURATION);
                eraShares = 0; // shares minted in the closed era stop counting
                emit EraAdvanced(storedEra, start + ERA_DURATION);
            } else if (eraShares >= SHARES_PER_ERA) {
                storedEra++;
                eraStarts.push(block.timestamp);
                eraShares -= SHARES_PER_ERA; // carry the remainder into the new era
                emit EraAdvanced(storedEra, block.timestamp);
            } else {
                break;
            }
        }
    }

    /// @dev Start time of era e. Recorded boundaries come from eraStarts;
    ///      eras beyond the recorded ones can only start on the 30-day
    ///      schedule (nothing mints while idle), so they extend by exactly
    ///      ERA_DURATION each.
    function _eraStart(uint256 e) internal view returns (uint256) {
        uint256 len = eraStarts.length;
        if (e <= len) return eraStarts[e - 1];
        return eraStarts[len - 1] + (e - len) * ERA_DURATION;
    }

    /// @dev The era (1..11) containing timestamp ts.
    function _eraAt(uint256 ts) internal view returns (uint256 e) {
        e = 1;
        while (e < MAX_ERA && _eraStart(e + 1) <= ts) {
            e++;
        }
    }

    // ---------- Owner controls ----------
    /// @notice Wire the PVP token after deployment. Owner-only, changeable
    ///         by the owner at any time (deploy order: NFT first, then
    ///         PvpToken with this contract as its mining reserve, then this).
    function setToken(address token) external onlyOwner {
        require(token != address(0), "Zero address");
        pvpToken = token;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
    }

    function setMintOpen(bool open) external onlyOwner {
        mintOpen = open;
    }

    function setEditionPrice(uint8 edition, uint256 price) external onlyOwner {
        require(edition <= 4, "Bad edition");
        editionPrice[edition] = price;
    }

    /// @notice Set an edition's hash rate (PVP wei per day). Applies to all
    ///         unclaimed accrual of that edition — see README.
    function setEditionRate(uint8 edition, uint256 ratePerDay) external onlyOwner {
        require(edition <= 4, "Bad edition");
        editionRate[edition] = ratePerDay;
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = payable(owner).call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    // ---------- ERC-721 ----------
    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "Zero address");
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Nonexistent token");
        return tokenOwner;
    }

    /// @notice All token IDs owned by an account, for site enumeration.
    function tokensOfOwner(address account) external view returns (uint256[] memory) {
        return _ownedTokens[account];
    }

    function approve(address approved, uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender == tokenOwner || _operatorApprovals[tokenOwner][msg.sender], "Not authorized");
        _tokenApprovals[tokenId] = approved;
        emit Approval(tokenOwner, approved, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "Nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address account, address operator) external view returns (bool) {
        return _operatorApprovals[account][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        transferFrom(from, to, tokenId);
        require(_checkReceived(from, to, tokenId, ""), "Unsafe recipient");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external {
        transferFrom(from, to, tokenId);
        require(_checkReceived(from, to, tokenId, data), "Unsafe recipient");
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x80ac58cd || interfaceId == 0x5b5e139f || interfaceId == 0x01ffc9a7;
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return spender == tokenOwner || spender == _tokenApprovals[tokenId] || _operatorApprovals[tokenOwner][spender];
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "Wrong owner");
        require(to != address(0), "Zero address");
        _tokenApprovals[tokenId] = address(0);
        emit Approval(from, address(0), tokenId);
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        // Enumeration: swap-and-pop out of the sender's list, append to the recipient's.
        uint256 idx = _ownedIndex[tokenId];
        uint256[] storage fromList = _ownedTokens[from];
        uint256 lastId = fromList[fromList.length - 1];
        fromList[idx] = lastId;
        _ownedIndex[lastId] = idx;
        fromList.pop();
        _ownedIndex[tokenId] = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);
        emit Transfer(from, to, tokenId);
    }

    function _checkReceived(address from, address to, uint256 tokenId, bytes memory data) internal returns (bool) {
        if (to.code.length == 0) return true;
        try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
            return retval == IERC721Receiver.onERC721Received.selector;
        } catch {
            return false;
        }
    }

    // ---------- Metadata ----------
    /// @notice Off-chain JSON metadata: baseURI + tokenId + ".json"
    ///         (e.g. ipfs://CID/1.json). Set baseURI with setBaseURI.
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "Nonexistent token");
        return string(abi.encodePacked(baseURI, _toString(tokenId), ".json"));
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

interface IPvpToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}
