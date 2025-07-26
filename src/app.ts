import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { responseUrlMapping } from './middleware/responseMapping';
import { specs, swaggerOptions, swaggerUi } from './config/swagger';
import { 
  compressionMiddleware, 
  responseTimeMiddleware, 
  paginationMiddleware,
  performanceHealthCheck,
  cacheStatsMiddleware,
  cacheClearMiddleware 
} from './middleware/performance';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Response URL mapping middleware (convert file paths to URLs) - only for API routes
app.use('/api', responseUrlMapping);

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Performance middleware
app.use(compressionMiddleware);
app.use(responseTimeMiddleware);
app.use(paginationMiddleware);

// Serve static files
app.use('/static', express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// Admin routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

app.get('/admin/auth', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/auth.html'));
});

// Performance monitoring endpoints
app.use(performanceHealthCheck);
app.use(cacheStatsMiddleware);
app.use(cacheClearMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Import routes
import authRoutes from './routes/auth';
import artistRoutes from './routes/artists';
import trackRoutes from './routes/tracks';
import playlistRoutes from './routes/playlists';
import albumRoutes from './routes/albums';
import searchRoutes from './routes/search';
import playerRoutes from './routes/player';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // This includes /users/me routes
app.use('/api/artists', artistRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/me/player', playerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (req, res) => {
  res.json({ message: 'Spotify Clone API is running!' });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}

export default app; 