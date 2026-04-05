import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import tokenRoutes from './routes/tokens.js';
import adminRoutes from './routes/admin.js';

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

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'QueueM Backend' });
});

export default app;
