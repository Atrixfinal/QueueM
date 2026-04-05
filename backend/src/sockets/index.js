import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'queuem-fallback-secret';

export default function initSockets(io) {
  // Socket auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    try {
      if (token) {
        const payload = jwt.verify(token, JWT_SECRET);
        socket.user = payload;
      } else {
        // Allow unauthenticated connections for demo
        socket.user = { id: 'anonymous', role: 'guest' };
      }
      return next();
    } catch (err) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id} (user: ${socket.user?.id})`);

    // Join user-specific room
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    // Subscribe to service/counter rooms
    socket.on('subscribe', (data) => {
      if (data?.locationId && data?.serviceId) {
        socket.join(`service:${data.locationId}:${data.serviceId}`);
      }
      if (data?.counterId) {
        socket.join(`counter:${data.counterId}`);
      }
    });

    socket.on('unsubscribe', (data) => {
      if (data?.locationId && data?.serviceId) {
        socket.leave(`service:${data.locationId}:${data.serviceId}`);
      }
      if (data?.counterId) {
        socket.leave(`counter:${data.counterId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}
