import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import artworksRouter from './routes/artworks';
import locationsRouter from './routes/locations';
import exhibitionsRouter from './routes/exhibitions';
import databaseRouter from './routes/database';

// Initialize database
import './database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://gallery-management-frontend.onrender.com'
];

if (process.env.NODE_ENV === 'production') {
  // Add your production frontend URL here
  allowedOrigins.push('https://gallery-management-frontend.onrender.com');
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/artworks', artworksRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/exhibitions', exhibitionsRouter);
app.use('/api/database', databaseRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
  console.error('Error:', err);
  
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    res.status(409).json({
      error: 'データの重複エラーが発生しました。同じ期間・場所での展示が既に存在します。'
    });
    return;
  }
  
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    res.status(400).json({
      error: '関連するデータが存在しません。'
    });
    return;
  }
  
  if (err.code === 'SQLITE_BUSY') {
    res.status(503).json({
      error: 'データベースが一時的に利用できません。しばらく時間をおいて再試行してください。'
    });
    return;
  }
  
  res.status(500).json({
    error: 'サーバー内部エラーが発生しました。'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Gallery management server is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});