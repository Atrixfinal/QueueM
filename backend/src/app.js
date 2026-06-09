import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import tokenRoutes from './routes/tokens.js';
import adminRoutes from './routes/admin.js';
import hospitalRoutes from './routes/hospital.js';

const app = express();

// Security
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
});
app.use(limiter);

// Routes
app.use('/auth', authRoutes);
app.use('/tokens', tokenRoutes);
app.use('/admin', adminRoutes);
app.use('/hospitals', hospitalRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'QueueM Backend' });
});

// Global error handler — prevents unhandled errors from crashing the server
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
