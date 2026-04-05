import { createToken, callNextToken } from '../services/tokenService.js';
import pool from '../db/index.js';

export const createTokenHandler = async (req, res) => {
  const { locationId, serviceId, priority, category, specialty, hospitalId } = req.body;
  const userId = req.user?.id || null;
  const userRole = req.user?.role;

  if (!locationId || !serviceId) {
    return res.status(400).json({ message: 'locationId and serviceId are required' });
  }

  try {
    const { token, estimated_wait_seconds } = await createToken({
      userId: userRole === 'guest' ? null : userId,
      tempUserId: userRole === 'guest' ? userId : null,
      locationId,
      serviceId,
      priority,
      category,
      specialty,
      hospitalId,
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`service:${locationId}:${serviceId}`).emit('queueUpdate', { locationId, serviceId });
      if (userId) {
        io.to(`user:${userId}`).emit('tokenCreated', { token });
      }
    }

    return res.status(201).json({ token, estimated_wait_seconds });
  } catch (err) {
    console.error('Create token error:', err);
    return res.status(500).json({ message: 'Internal error' });
  }
};

export const callNextHandler = async (req, res) => {
  const { counterId, serviceId } = req.body;

  if (!counterId) {
    return res.status(400).json({ message: 'counterId is required' });
  }

  try {
    const counterRes = await pool.query(
      'SELECT id, location_id FROM counters WHERE id = $1',
      [counterId]
    );

    if (counterRes.rowCount === 0) {
      return res.status(404).json({ message: 'Counter not found' });
    }

    const locationId = counterRes.rows[0].location_id;

    if (!serviceId) {
      return res.status(400).json({ message: 'serviceId is required' });
    }

    const { token, error } = await callNextToken({ counterId, locationId, serviceId });

    if (error) {
      return res.status(400).json({ message: error });
    }

    const io = req.app.get('io');
    if (io && token) {
      io.to(`counter:${counterId}`).emit('tokenCalled', { token });
      io.to(`service:${locationId}:${serviceId}`).emit('tokenCalled', { token });
      if (token.user_id) {
        io.to(`user:${token.user_id}`).emit('tokenCalled', { token });
      }
    }

    return res.json({ token });
  } catch (err) {
    console.error('Call next error:', err);
    return res.status(500).json({ message: 'Internal error' });
  }
};
