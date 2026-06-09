import express from 'express';
import { authenticateJWT } from '../middlewares/authJwt.js';
import { permit } from '../middlewares/role.js';

const router = express.Router();

// Admin routes placeholder — add DB logic when needed
router.post('/locations', authenticateJWT, permit('admin'), async (req, res) => {
  return res.status(201).json({ message: 'Create location — not yet implemented' });
});

router.get('/metrics', authenticateJWT, permit('admin', 'staff'), async (req, res) => {
  return res.json({ message: 'Metrics — not yet implemented' });
});

export default router;
