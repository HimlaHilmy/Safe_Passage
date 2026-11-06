const mongoose = require('mongoose');

let isConnected = false;

// Global Mongoose connection event listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log(`[Database Event] Mongoose connected successfully to: ${mongoose.connection.host}:${mongoose.connection.port || 27017}/${mongoose.connection.name}`);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Database Event] Mongoose connection lost / disconnected.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('[Database Event Error]', err.message);
});

/**
 * Ensures baseline demo users exist in MongoDB so relations and references resolve correctly
 */
async function ensureDemoUsers() {
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Database Seed] Seeding default demo accounts into safe_passage MongoDB...');
      await User.create([
        {
          _id: new mongoose.Types.ObjectId('65e000000000000000000001'),
          name: 'Sarah Jenkins',
          email: 'traveler@safepassage.org',
          passwordHash: 'Password123!', // Pre-save hook hashes this
          role: 'traveler',
          phone: '+1 (555) 234-5678',
          accountStatus: 'active',
        },
        {
          _id: new mongoose.Types.ObjectId('65e000000000000000000002'),
          name: 'Apex Rapid Response Ltd',
          email: 'provider@safepassage.org',
          passwordHash: 'Password123!',
          role: 'provider',
          phone: '+1 (555) 987-6543',
          accountStatus: 'active',
          providerDetails: {
            serviceTypes: ['Roadside Towing & Vehicle Repair', 'Emergency Paramedic Escort'],
            licenseNumber: 'SRI-EMERG-2024-88',
            verified: true,
            isAvailable: true,
            currentLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
          },
        },
        {
          _id: new mongoose.Types.ObjectId('65e000000000000000000003'),
          name: 'Himla (Admin Lead)',
          email: 'admin@safepassage.org',
          passwordHash: 'Password123!',
          role: 'admin',
          phone: '+1 (555) 000-1122',
          accountStatus: 'active',
        },
      ]);
      console.log('[Database Seed] Default demo accounts initialized successfully.');
    }
  } catch (seedErr) {
    console.warn('[Database Seed Notice] Demo accounts check notice:', seedErr.message);
  }
}

/**
 * Connect to MongoDB
 * Attempts configured MONGODB_URI/MONGO_URI first with explicit dbName: 'safe_passage'.
 * If the cloud URI is unreachable (e.g., Atlas IP whitelist block), attempts local MongoDB fallback.
 */
const connectDB = async () => {
  const configuredUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const dbName = process.env.DB_NAME || 'safe_passage';

  const connectionCandidates = [];

  if (configuredUri) {
    const isAtlas = configuredUri.includes('.mongodb.net');
    connectionCandidates.push({
      uri: configuredUri,
      label: isAtlas ? 'MongoDB Atlas Cloud Cluster' : 'Configured MongoDB URI',
      timeout: isAtlas ? 8000 : 5000,
    });
  }

  // Local fallback candidate
  connectionCandidates.push({
    uri: 'mongodb://127.0.0.1:27017/safe_passage',
    label: 'Local MongoDB Instance (127.0.0.1:27017)',
    timeout: 3000,
  });

  let lastError = null;

  for (const candidate of connectionCandidates) {
    try {
      const maskedUri = candidate.uri.replace(/:([^:@]+)@/, ':****@');
      console.log(`[Database] Attempting connection to ${candidate.label} (${maskedUri})...`);

      const conn = await mongoose.connect(candidate.uri, {
        dbName,
        serverSelectionTimeoutMS: candidate.timeout,
        connectTimeoutMS: candidate.timeout,
      });

      isConnected = true;
      console.log(`=======================================================`);
      console.log(`  [Database] SUCCESS: Connected to MongoDB!            `);
      console.log(`  Target:   ${candidate.label}                         `);
      console.log(`  Host:     ${conn.connection.host}                    `);
      console.log(`  Port:     ${conn.connection.port || 27017}          `);
      console.log(`  Database: ${conn.connection.name} (Verified: safe_passage) `);
      console.log(`=======================================================`);

      await ensureDemoUsers();

      return conn;
    } catch (err) {
      lastError = err;
      const maskedUri = candidate.uri.replace(/:([^:@]+)@/, ':****@');
      console.warn(`[Database Warning] Could not connect to ${candidate.label} (${maskedUri}).`);
      console.warn(`  Reason: ${err.message}`);
    }
  }

  isConnected = false;
  console.error(`=======================================================`);
  console.error(`  [Database Fatal Error] Failed to connect to MongoDB! `);
  console.error(`  Reason: ${lastError?.message}                         `);
  console.error(`  ---------------------------------------------------  `);
  console.error(`  TROUBLESHOOTING INSTRUCTIONS:                        `);
  console.error(`  1. MongoDB Atlas: Check that your current IP address `);
  console.error(`     is added to Network Access whitelist in Atlas     `);
  console.error(`     (allow 0.0.0.0/0 for all IP access).              `);
  console.error(`  2. Local MongoDB: Ensure 'mongod' is running:        `);
  console.error(`     mongod --dbpath server/data_db --port 27017       `);
  console.error(`=======================================================`);
  return null;
};

const getDBStatus = () => ({
  connected: isConnected && mongoose.connection.readyState === 1,
  host: isConnected ? mongoose.connection.host : 'Disconnected',
  port: isConnected ? mongoose.connection.port || 27017 : null,
  dbName: isConnected ? mongoose.connection.name : 'None',
  readyState: mongoose.connection.readyState,
});

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

module.exports = { connectDB, getDBStatus, isDbConnected };
