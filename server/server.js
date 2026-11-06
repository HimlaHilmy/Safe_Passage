const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config(); // Also check root cwd
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');
const { getCorsOriginChecker } = require('./config/cors');
const socketHandler = require('./sockets/socketHandler');
const seedInitialData = require('./utils/seedData');
const { seedEmergencyServices } = require('./controllers/serviceController');

let PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';
const server = http.createServer(app);

// Setup Socket.io with production-ready CORS origin checker
const io = new Server(server, {
  cors: {
    origin: getCorsOriginChecker(),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
});

socketHandler(io);

// Make io accessible in request handlers if needed
app.set('io', io);

// Start server after connecting to database
const startServer = async () => {
  await connectDB();
  await seedInitialData();
  await seedEmergencyServices();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (process.env.NODE_ENV === 'production') {
        console.error(`[Server Fatal] Assigned PORT ${PORT} is already in use. Cloud services require listening on assigned PORT.`);
        process.exit(1);
      } else {
        console.warn(`[Server] Port ${PORT} is in use. Trying port ${Number(PORT) + 1}...`);
        PORT = Number(PORT) + 1;
        server.listen(PORT, HOST);
      }
    } else {
      console.error('[Server Error]', err);
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`  SAFE PASSAGE API SERVER RUNNING                      `);
    console.log(`  Host & Port: http://${HOST}:${PORT}                  `);
    console.log(`  Health Check: http://${HOST}:${PORT}/api/health      `);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error('[Process Error] Unhandled Rejection:', err);
});

module.exports = app;
