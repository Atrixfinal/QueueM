import express from 'express';
import { register, login, guestOTP, verifyOTP, updateLocation } from '../controllers/authController.js';
import { authenticateJWT } from '../middlewares/authJwt.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/guest-otp', guestOTP);
router.post('/verify-otp', verifyOTP);
router.patch('/update-location', authenticateJWT, updateLocation);

export default router;
