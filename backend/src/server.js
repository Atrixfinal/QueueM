import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

import app from './app.js';
import initSockets from './sockets/index.js';

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' },
});

initSockets(io);

// Attach io to express app so controllers can emit events
app.set('io', io);

server.listen(PORT, () => {
  console.log(`[QueueM] Server running on port ${PORT}`);
});
