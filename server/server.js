require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');
const socketHandler = require('./sockets/socketHandler');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
});

socketHandler(io);

// Make io accessible in request handlers if needed
app.set('io', io);

// Start server after connecting to database
const startServer = async () => {
  await connectDB();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} is in use. Trying port ${Number(PORT) + 1}...`);
      PORT = Number(PORT) + 1;
      server.listen(PORT);
    } else {
      console.error('[Server Error]', err);
    }
  });

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  SAFE PASSAGE API SERVER RUNNING                      `);
    console.log(`  Port: http://localhost:${PORT}                       `);
    console.log(`  Health Check: http://localhost:${PORT}/api/health     `);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error('[Process Error] Unhandled Rejection:', err);
});
