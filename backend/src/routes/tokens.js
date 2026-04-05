import express from 'express';
import { createTokenHandler, callNextHandler } from '../controllers/tokenController.js';
import { authenticateJWT } from '../middlewares/authJwt.js';

const router = express.Router();

router.post('/', authenticateJWT, createTokenHandler);
router.post('/call-next', authenticateJWT, callNextHandler);

export default router;
