import { expect } from "chai";
import { ethers } from "hardhat";
import { RWADiscoveryCard, AssetDexterFactory } from "../typechain-types";

describe("AssetDexter Contracts", function () {
  let discoveryCard: RWADiscoveryCard;
  let factory: AssetDexterFactory;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy factory which will deploy the NFT contract
    const AssetDexterFactoryContract = await ethers.getContractFactory("AssetDexterFactory");
    factory = await AssetDexterFactoryContract.deploy("https://api.assetdexter.com/metadata/");
    
    // Get the deployed discovery card address from factory
    discoveryCard = await ethers.getContractAt("RWADiscoveryCard", await factory.discoveryCard());
  });

  describe("RWADiscoveryCard", function () {
    it("Should deploy with correct name and symbol", async function () {
      expect(await discoveryCard.name()).to.equal("AssetDexter Discovery Card");
      expect(await discoveryCard.symbol()).to.equal("RWA-DEX");
    });

    it("Should allow factory to mint discovery cards", async function () {
      const mintingFee = await factory.mintingFee();
      
      await factory.connect(user).discoverRWA(
        0, 2, 1, 75, 80, "0xTestAsset123", 
        "Ondo OUSG", "OUSG", ethers.parseUnits("105", 6), 450, 
        "ipfs://QmTokenURI",
        { value: mintingFee }
      );

      expect(await discoveryCard.totalDiscoveries()).to.equal(1);
      expect(await discoveryCard.ownerOf(1)).to.equal(user.address);
    });

    it("Should prevent duplicate asset discovery", async function () {
      const mintingFee = await factory.mintingFee();
      const assetAddress = "0xDuplicateAsset";
      
      await factory.connect(user).discoverRWA(
        0, 2, 1, 75, 80, assetAddress, "Ondo OUSG", "OUSG", 
        ethers.parseUnits("105", 6), 450, "ipfs://QmTokenURI",
        { value: mintingFee }
      );

      await expect(
        factory.connect(user).discoverRWA(
          0, 2, 1, 75, 80, assetAddress, "Ondo OUSG", "OUSG", 
          ethers.parseUnits("105", 6), 450, "ipfs://QmTokenURI",
          { value: mintingFee }
        )
      ).to.be.revertedWith("Asset already discovered");
    });
  });

  describe("AssetDexterFactory", function () {
    it("Should mint through factory with fee", async function () {
      const mintingFee = await factory.mintingFee();
      
      const tx = await factory.connect(user).discoverRWA(
        0, 2, 1, 75, 80, "0xDifferentAssetAddress123", 
        "Ondo OUSG", "OUSG", ethers.parseUnits("105", 6), 450, 
        "ipfs://QmTokenURI",
        { value: mintingFee }
      );

      await expect(tx)
        .to.emit(factory, "NewDiscovery")
        .withArgs(user.address, 1, 75);
    });

    it("Should update user stats on discovery", async function () {
      const mintingFee = await factory.mintingFee();
      
      await factory.connect(user).discoverRWA(
        0, 2, 1, 75, 80, "0xAnotherAssetAddress456", 
        "Ondo OUSG", "OUSG", ethers.parseUnits("105", 6), 450, 
        "ipfs://QmTokenURI",
        { value: mintingFee }
      );

      const [totalScore, discoveryCount, averageRarity] = await factory.getUserStats(user.address);
      
      expect(discoveryCount).to.equal(1);
      expect(totalScore).to.equal(75);
      expect(averageRarity).to.equal(75);
    });

    it("Should batch mint multiple assets", async function () {
      const mintingFee = await factory.mintingFee();
      const batchFee = mintingFee * 2n;
      
      await factory.connect(user).batchDiscoverRWA(
        [0, 1], // AssetTypes
        [2, 3], // Rarities
        [1, 2], // Risks
        [75, 85], // rarityScores
        [80, 70], // predictionScores
        ["0xBatchAsset1", "0xBatchAsset2"], // assetAddresses
        ["OUSG", "Real Estate"], // assetNames
        ["OUSG", "REAL"], // assetSymbols
        [ethers.parseUnits("105", 6), ethers.parseUnits("500", 6)], // currentValues
        [450, 650], // yieldRates
        ["ipfs://1", "ipfs://2"], // tokenURIs
        { value: batchFee }
      );

      expect(await discoveryCard.totalDiscoveries()).to.equal(2);
      
      const [totalScore, discoveryCount, averageRarity] = await factory.getUserStats(user.address);
      expect(discoveryCount).to.equal(2);
      expect(totalScore).to.equal(160); // 75 + 85
      expect(averageRarity).to.equal(80); // 160 / 2
    });
  });
});