require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');
const socketHandler = require('./sockets/socketHandler');
const seedInitialData = require('./utils/seedData');

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
<<<<<<< HEAD
  const { seedEmergencyServices } = require('./controllers/serviceController');
  await seedEmergencyServices();
=======
  await seedInitialData();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} is in use. Trying port ${Number(PORT) + 1}...`);
      PORT = Number(PORT) + 1;
      server.listen(PORT);
    } else {
      console.error('[Server Error]', err);
    }
  });
>>>>>>> e3f5fbff3f7c3eb50786efc252d196fdc2fd6370

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
