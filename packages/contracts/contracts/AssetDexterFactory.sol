// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RWADiscoveryCard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AssetDexterFactory
 * @dev Factory contract to manage RWA Discovery Card minting with additional logic
 */
contract AssetDexterFactory is Ownable {
    RWADiscoveryCard public discoveryCard;
    
    // Minting fees (in wei)
    uint256 public mintingFee = 0.001 ether;
    
    // Leaderboard tracking
    mapping(address => uint256) public userScores;
    mapping(address => uint256) public userDiscoveryCount;
    
    // Events
    event NewDiscovery(address indexed discoverer, uint256 tokenId, uint256 rarityScore);
    event MintingFeeUpdated(uint256 newFee);
    
    constructor(string memory baseURI) {
        // Deploy a new RWADiscoveryCard and make this factory the owner
        discoveryCard = new RWADiscoveryCard(baseURI);
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Discover a new RWA asset (main minting function)
     */
    function discoverRWA(
        RWADiscoveryCard.AssetType _assetType,
        RWADiscoveryCard.RarityTier _rarity,
        RWADiscoveryCard.RiskTier _risk,
        uint256 _rarityScore,
        uint256 _predictionScore,
        string calldata _assetAddress,
        string calldata _assetName,
        string calldata _assetSymbol,
        uint256 _currentValue,
        uint256 _yieldRate,
        string calldata _tokenURI
    ) external payable returns (uint256) {
        // Check minting fee
        require(msg.value >= mintingFee, "Insufficient minting fee");
        
        // Mint the discovery card directly to user
        uint256 tokenId = discoveryCard.discoverAsset(
            msg.sender, // Mint directly to the user
            _assetType,
            _rarity,
            _risk,
            _rarityScore,
            _predictionScore,
            _assetAddress,
            _assetName,
            _assetSymbol,
            _currentValue,
            _yieldRate,
            _tokenURI
        );
        
        // Update leaderboard
        userDiscoveryCount[msg.sender]++;
        userScores[msg.sender] += _rarityScore;
        
        emit NewDiscovery(msg.sender, tokenId, _rarityScore);
        
        return tokenId;
    }
    
    /**
     * @dev Batch discover multiple assets
     */
    function batchDiscoverRWA(
        RWADiscoveryCard.AssetType[] calldata _assetTypes,
        RWADiscoveryCard.RarityTier[] calldata _rarities,
        RWADiscoveryCard.RiskTier[] calldata _risks,
        uint256[] calldata _rarityScores,
        uint256[] calldata _predictionScores,
        string[] calldata _assetAddresses,
        string[] calldata _assetNames,
        string[] calldata _assetSymbols,
        uint256[] calldata _currentValues,
        uint256[] calldata _yieldRates,
        string[] calldata _tokenURIs
    ) external payable {
        require(_assetTypes.length == _rarities.length, "Array length mismatch");
        require(msg.value >= mintingFee * _assetTypes.length, "Insufficient minting fee");
        
        for (uint256 i = 0; i < _assetTypes.length; i++) {
            // Call the discoveryCard directly to user
            uint256 tokenId = discoveryCard.discoverAsset(
                msg.sender,
                _assetTypes[i],
                _rarities[i],
                _risks[i],
                _rarityScores[i],
                _predictionScores[i],
                _assetAddresses[i],
                _assetNames[i],
                _assetSymbols[i],
                _currentValues[i],
                _yieldRates[i],
                _tokenURIs[i]
            );
            
            // Update leaderboard for this discovery
            userDiscoveryCount[msg.sender]++;
            userScores[msg.sender] += _rarityScores[i];
            
            emit NewDiscovery(msg.sender, tokenId, _rarityScores[i]);
        }
    }
    
    /**
     * @dev Get user stats for leaderboard
     */
    function getUserStats(address _user) 
        external 
        view 
        returns (uint256 totalScore, uint256 discoveryCount, uint256 averageRarity) 
    {
        totalScore = userScores[_user];
        discoveryCount = userDiscoveryCount[_user];
        averageRarity = discoveryCount > 0 ? totalScore / discoveryCount : 0;
    }
    
    /**
     * @dev Update minting fee (only owner)
     */
    function setMintingFee(uint256 _newFee) external onlyOwner {
        mintingFee = _newFee;
        emit MintingFeeUpdated(_newFee);
    }
    
    /**
     * @dev Withdraw collected fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}