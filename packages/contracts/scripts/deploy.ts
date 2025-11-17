import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log(" Deploying AssetDexter Contracts...");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);

  // Deploy RWADiscoveryCard
  const RWADiscoveryCard = await ethers.getContractFactory("RWADiscoveryCard");
  const discoveryCard = await RWADiscoveryCard.deploy("https://api.assetdexter.com/metadata/");
  
  await discoveryCard.waitForDeployment();
  const discoveryCardAddress = await discoveryCard.getAddress();
  console.log(` RWADiscoveryCard deployed to: ${discoveryCardAddress}`);

  // Deploy AssetDexterFactory
  const AssetDexterFactory = await ethers.getContractFactory("AssetDexterFactory");
  const factory = await AssetDexterFactory.deploy(discoveryCardAddress);
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(` AssetDexterFactory deployed to: ${factoryAddress}`);

  // Save deployment addresses
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    timestamp: new Date().toISOString(),
    contracts: {
      RWADiscoveryCard: discoveryCardAddress,
      AssetDexterFactory: factoryAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `deployment-${Date.now()}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(" Deployment info saved!");
  console.log("\n AssetDexter contracts deployed successfully!");
  console.log(` RWADiscoveryCard: ${discoveryCardAddress}`);
  console.log(` AssetDexterFactory: ${factoryAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});