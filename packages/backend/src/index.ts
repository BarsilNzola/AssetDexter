import dotenv from 'dotenv';import express from 'express';
import cors from 'cors';
import { config } from './utils/config';
import scanRoutes from './routes/scan';
import assetsRoutes from './routes/assets';
import analysisRoutes from './routes/analysis';
import contractsRoutes from './routes/contracts';

dotenv.config();

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/scan', scanRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/contracts', contractsRoutes);

// Test endpoint to verify all services
app.get('/api/test', async (req, res) => {
  try {
    const { DeFiLlamaService } = await import('./services/data-ingestion/defi-llama');
    const { OnChainDataService } = await import('./services/data-ingestion/on-chain');
    const { ContractService } = await import('./services/contracts');
    
    const defiLlamaService = new DeFiLlamaService();
    const onChainService = new OnChainDataService();
    
    // Test DeFi Llama
    const pools = await defiLlamaService.fetchRWAPools();
    const defiTest = pools.slice(0, 3).map(pool => ({
      name: pool.project,
      symbol: pool.symbol,
      tvl: pool.tvl
    }));

    // Test on-chain data (using a known token)
    interface OnChainTestResult {
      name?: string;
      symbol?: string;
      supply?: string;
      error?: string;
    }

    let onChainTest: OnChainTestResult = {};
    try {
      const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC on Ethereum
      const tokenData = await onChainService.fetchTokenData(usdcAddress, 1);
      onChainTest = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        supply: tokenData.totalSupply
      };
    } catch (error) {
      onChainTest = { error: 'On-chain data fetch failed' };
    }

    // Test contracts (if addresses are set)
    interface ContractTestResult {
      totalDiscoveries?: string;
      status?: string;
      error?: string;
    }

    let contractTest: ContractTestResult = {};
    if (config.contracts.discoveryCard && config.contracts.factory) {
      try {
        const contractService = new ContractService();
        const totalDiscoveries = await contractService.getTotalDiscoveries();
        contractTest = {
          totalDiscoveries: totalDiscoveries.toString(),
          status: 'Connected to contracts'
        };
      } catch (error) {
        contractTest = { error: 'Contract connection failed' };
      }
    } else {
      contractTest = { status: 'Contract addresses not configured' };
    }

    // Test Covalent (if API key is set)
    interface CovalentTestResult {
      success?: boolean;
      data?: any;
      error?: string;
      status?: string;
    }

    let covalentTest: CovalentTestResult = {};
    if (process.env.COVALENT_API_KEY) {
      try {
        const { BlockchainService } = await import('./utils/blockchain');
        const blockchainService = new BlockchainService();
        const covalentResult = await blockchainService.testCovalent();
        covalentTest = covalentResult;
      } catch (error) {
        covalentTest = { error: 'Covalent test failed' };
      }
    } else {
      covalentTest = { status: 'Covalent API key not configured' };
    }

    res.json({
      status: 'Backend is running! 🚀',
      timestamp: new Date().toISOString(),
      tests: {
        defiLlama: {
          status: 'success',
          data: defiTest
        },
        onChain: {
          status: onChainTest.error ? 'failed' : 'success', 
          data: onChainTest
        },
        contracts: {
          status: contractTest.error ? 'failed' : 'info',
          data: contractTest
        },
        covalent: {
          status: covalentTest.error ? 'failed' : covalentTest.success ? 'success' : 'info',
          data: covalentTest
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(` AssetDexter backend running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(` Scan endpoint: http://localhost:${PORT}/api/scan`);
  console.log(` Assets endpoint: http://localhost:${PORT}/api/assets`);
  console.log(` Analysis endpoint: http://localhost:${PORT}/api/analysis`);
  console.log(` Contracts endpoint: http://localhost:${PORT}/api/contracts`);
});

export default app;