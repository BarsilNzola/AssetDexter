import express from 'express';
import cors from 'cors';
import { config } from './utils/config';
import scanRoutes from './routes/scan';
import assetsRoutes from './routes/assets';
import analysisRoutes from './routes/analysis';
import contractsRoutes from './routes/contracts';

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
  console.log(`AssetDexter backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;