AssetDexter - RWA Discovery Game
=================================================
What is AssetDexter?
--------------------

AssetDexter transforms **Real World Asset (RWA) discovery** into an engaging game. Hunt, analyze, and collect tokenized assets like treasuries, real estate, art, and luxury goods through an AI-powered "Pokédex" interface.

### Core Concept

-   **AI Agent as Pokédex**: Scans and analyzes RWAs in real-time

-   **Discovery Cards**: NFT collectibles representing analyzed assets

-   **Rarity Tiers**: Pokémon-inspired ranking (Common → Mythic)

-   **Leaderboards**: Compete to discover the most valuable assets

Architecture
----------------

``` text

assetdexter/
├── 📁 packages/
│   ├── 📁 contracts/          # Smart Contracts 
│   ├── 📁 frontend/           # Vite + React UI 
│   ├── 📁 backend/            # AI Analysis Engine 
│   └── 📁 shared/             # Shared Types & Utils 

```

Smart Contracts
-------------------------------

### **Live on Mantle Sepolia**

-   **RWADiscoveryCard**: [`0x319A206621251f7b2582E5fa8c9E084D1371d09B`]

-   **AssetDexterFactory**: [`0xEBBf602115Ccb466B4831777A5C7854dcC7c8283`]

### **Contract Features**

solidity

// Game Mechanics
- Rarity Tiers: Common, Uncommon, Rare, Epic, Legendary, Mythic
- Asset Types: Tokenized Treasuries, Real Estate, Art, Luxury Goods, etc.
- Risk Assessment: Very Low → Very High
- Leaderboard System with User Scores

// Economics
- Minting Fee: 0.001 MNT per discovery
- Batch Minting: Multiple assets in one transaction
- Anti-Duplication: Prevents duplicate asset discovery

// Analytics
- Rarity Scores (0-100)
- Prediction Scores (Bullish confidence)
- User Discovery Statistics

How It Works
---------------

### 1\. **Scan for Assets**

AI agent scans live RWA data from:

-   On-chain analytics (DeFi Llama, tokenized treasuries)

-   Luxury asset markets (CreatorBid API)

-   Real-world data feeds

### 2\. **Analyze & Score**

AI models calculate:

-   **Rarity Score** (0-100) based on supply, uniqueness, demand

-   **Risk Tier** from Very Low to Very High

-   **Market Prediction** with confidence scores

### 3\. **Mint Discovery Cards**

Users mint NFTs representing their RWA discoveries with rich metadata:

json

{
  "name": "Ondo OUSG #001",
  "description": "Tokenized US Treasury Discovery",
  "attributes": [
    {"trait_type": "Rarity", "value": "Rare"},
    {"trait_type": "Asset Type", "value": "Tokenized Treasury"},
    {"trait_type": "Risk", "value": "Low"},
    {"trait_type": "Rarity Score", "value": 75},
    {"trait_type": "Current Yield", "value": "4.5%"}
  ]
}

### 4\. **Compete & Collect**

-   Build your **AssetDex** collection

-   Climb the **leaderboards**

-   Discover **legendary** assets first

Tech Stack
--------------

### **Blockchain**

-   **Network**: Mantle Sepolia (EVM-compatible)

-   **Contracts**: Solidity 0.8.19 + OpenZeppelin

-   **Tools**: Hardhat, Ethers v6

### **Frontend**

-   **Framework**: Vite + React 18 + TypeScript

-   **Web3**: Wagmi v2 + Viem

-   **Styling**: Tailwind CSS + Framer Motion

### **Backend** (Planned)

-   **AI/ML**: TensorFlow.js for scoring models

-   **APIs**: DeFi Llama, On-chain data, CreatorBid

-   **Storage**: IPFS for metadata

-   **Cache**: simple-cache for performance

Quick Start
--------------

### **Prerequisites**

-   Node.js 18+

-   Git

-   Wallet with Mantle Sepolia MNT

### **1\. Clone & Setup**

bash

git clone <repository-url>
cd assetdexter
npm install

### **2\. Test Contracts**

bash

cd packages/contracts
npm test

### **3\. Deploy (Optional)**

bash

# Set environment variables
echo "PRIVATE_KEY=your_wallet_private_key" > .env

# Deploy to Linea Sepolia
npm run deploy: mantle

### **4\. Run Frontend**

bash

cd packages/frontend
npm run dev

Roadmap
----------

### **Phase 1: Core MVP** 

-   Smart contract development & testing

-   Mantle Sepolia deployment

-   Basic frontend setup

### **Phase 2: AI Integration** 

-   Backend AI analysis engine

-   RWA data ingestion pipelines

-   Rarity scoring algorithms

### **Phase 3: Game Experience**

-   AssetDex collection viewer

-   Leaderboard system

-   Mobile-responsive design

### **Phase 4: Enhanced Features**

-   Social features & sharing

-   Advanced AI predictions

-   Cross-chain expansion

-   Governance & community

Contributing
---------------

We welcome contributions! 

1.  Fork the repository

2.  Create your feature branch (`git checkout -b feature/amazing-feature`)

3.  Commit your changes (`git commit -m 'Add amazing feature'`)

4.  Push to the branch (`git push origin feature/amazing-feature`)

5.  Open a Pull Request

License
----------

This project is licensed under the MIT License - see the [LICENSE](https://LICENSE) file for details.