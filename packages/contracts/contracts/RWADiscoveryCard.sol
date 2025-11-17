// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title RWADiscoveryCard
 * @dev NFT contract for AssetDexter RWA Discovery Cards
 * Each card represents a discovered Real-World Asset with unique metadata
 */
contract RWADiscoveryCard is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;
    
    Counters.Counter private _tokenIdCounter;
    
    // RWA Asset Types
    enum AssetType {
        TOKENIZED_TREASURY,  // 0
        REAL_ESTATE,         // 1  
        ART,                 // 2
        LUXURY_GOODS,        // 3
        COMMODITIES,         // 4
        PRIVATE_CREDIT,      // 5
        CARBON_CREDITS,      // 6
        OTHER                // 7
    }
    
    // Rarity Tiers (like Pokémon)
    enum RarityTier {
        COMMON,      // 0
        UNCOMMON,    // 1
        RARE,        // 2
        EPIC,        // 3
        LEGENDARY,   // 4
        MYTHIC       // 5
    }
    
    // Risk Tiers
    enum RiskTier {
        VERY_LOW,    // 0
        LOW,         // 1
        MEDIUM,      // 2
        HIGH,        // 3
        VERY_HIGH    // 4
    }
    
    // Discovery Card Metadata
    struct DiscoveryCard {
        uint256 tokenId;
        address discoverer;
        uint256 discoveryTimestamp;
        AssetType assetType;
        RarityTier rarity;
        RiskTier risk;
        uint256 rarityScore;        // 0-100
        uint256 predictionScore;    // 0-100 (bullish confidence)
        string assetAddress;        // Token/contract address
        string assetName;
        string assetSymbol;
        uint256 currentValue;       // In USD (scaled)
        uint256 yieldRate;          // APY percentage (scaled)
    }
    
    // Mapping from token ID to Discovery Card
    mapping(uint256 => DiscoveryCard) public discoveryCards;
    
    // Mapping to prevent duplicate mints for same asset
    mapping(string => bool) public assetDiscovered;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Events
    event AssetDiscovered(
        uint256 indexed tokenId,
        address indexed discoverer,
        AssetType assetType,
        RarityTier rarity,
        string assetAddress
    );
    
    event RarityUpdated(uint256 indexed tokenId, RarityTier newRarity);
    
    constructor(string memory baseURI) ERC721("AssetDexter Discovery Card", "RWA-DEX") {
        _baseTokenURI = baseURI;
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Mint a new Discovery Card for a RWA
     * @param _to The address that will receive the NFT
     */
    function discoverAsset(
        address _to,
        AssetType _assetType,
        RarityTier _rarity,
        RiskTier _risk,
        uint256 _rarityScore,
        uint256 _predictionScore,
        string calldata _assetAddress,
        string calldata _assetName,
        string calldata _assetSymbol,
        uint256 _currentValue,
        uint256 _yieldRate,
        string calldata _tokenURI
    ) external onlyOwner returns (uint256) {
        // Prevent duplicate discoveries of same asset
        require(!assetDiscovered[_assetAddress], "Asset already discovered");
        
        // Validate scores
        require(_rarityScore <= 100, "Invalid rarity score");
        require(_predictionScore <= 100, "Invalid prediction score");
        
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        
        // Mint the NFT directly to the specified address
        _safeMint(_to, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        
        // Create discovery card
        DiscoveryCard memory newCard;
        newCard.tokenId = newTokenId;
        newCard.discoverer = _to; // Record the actual discoverer
        newCard.discoveryTimestamp = block.timestamp;
        newCard.assetType = _assetType;
        newCard.rarity = _rarity;
        newCard.risk = _risk;
        newCard.rarityScore = _rarityScore;
        newCard.predictionScore = _predictionScore;
        newCard.assetAddress = _assetAddress;
        newCard.assetName = _assetName;
        newCard.assetSymbol = _assetSymbol;
        newCard.currentValue = _currentValue;
        newCard.yieldRate = _yieldRate;
        
        discoveryCards[newTokenId] = newCard;
        assetDiscovered[_assetAddress] = true;
        
        emit AssetDiscovered(newTokenId, _to, _assetType, _rarity, _assetAddress);
        
        return newTokenId;
    }
    
    /**
     * @dev Update card rarity (only owner - for AI model updates)
     */
    function updateRarity(uint256 _tokenId, RarityTier _newRarity, uint256 _newRarityScore) 
        external 
        onlyOwner 
    {
        require(_exists(_tokenId), "Token does not exist");
        require(_newRarityScore <= 100, "Invalid rarity score");
        
        discoveryCards[_tokenId].rarity = _newRarity;
        discoveryCards[_tokenId].rarityScore = _newRarityScore;
        
        emit RarityUpdated(_tokenId, _newRarity);
    }
    
    /**
     * @dev Get Discovery Card details
     */
    function getDiscoveryCard(uint256 _tokenId) 
        external 
        view 
        returns (DiscoveryCard memory) 
    {
        require(_exists(_tokenId), "Token does not exist");
        return discoveryCards[_tokenId];
    }
    
    /**
     * @dev Get all cards discovered by an address
     */
    function getDiscovererCards(address _discoverer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 totalTokens = _tokenIdCounter.current();
        uint256 count = 0;
        
        // First pass: count matching tokens
        for (uint256 i = 1; i <= totalTokens; i++) {
            if (_exists(i) && ownerOf(i) == _discoverer) {
                count++;
            }
        }
        
        // Second pass: populate array
        uint256[] memory tokenIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalTokens; i++) {
            if (_exists(i) && ownerOf(i) == _discoverer) {
                tokenIds[index] = i;
                index++;
            }
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Get total discoveries count
     */
    function totalDiscoveries() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev Check if asset has been discovered
     */
    function isAssetDiscovered(string calldata _assetAddress) external view returns (bool) {
        return assetDiscovered[_assetAddress];
    }
    
    /**
     * @dev Override base URI
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Update base URI (only owner)
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    // The following functions are overrides required by Solidity.
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}