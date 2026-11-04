// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title PVP - Pokepvp Token (ERC-20)
/// @notice Fixed supply of 1,000,000,000 PVP. At deployment 60% goes to the
///         mining reserve (the PokepvpNode NFT contract, passed as a
///         constructor argument) and 40% to the deployer/owner. The NFT
///         contract pays mining yield out of its reserve balance; no PVP
///         can ever be minted after deployment.
contract PvpToken {
    string public name = "Pokepvp Token";
    string public symbol = "PVP";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed account, address indexed spender, uint256 value);

    /// @param miningReserve Address that receives the 600,000,000 PVP mining
    ///        reserve (deploy PokepvpNode first and pass its address here).
    constructor(address miningReserve) {
        require(miningReserve != address(0), "Zero address");
        owner = msg.sender;
        totalSupply = 1_000_000_000 * 10 ** 18;
        uint256 reserveAmount = 600_000_000 * 10 ** 18; // 60% mining reserve
        balanceOf[miningReserve] = reserveAmount;
        balanceOf[msg.sender] = totalSupply - reserveAmount; // 40% to deployer
        emit Transfer(address(0), miningReserve, reserveAmount);
        emit Transfer(address(0), msg.sender, totalSupply - reserveAmount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _move(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "Allowance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        _move(from, to, amount);
        return true;
    }

    function _move(address from, address to, uint256 amount) internal {
        require(to != address(0), "Zero address");
        require(balanceOf[from] >= amount, "Balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
