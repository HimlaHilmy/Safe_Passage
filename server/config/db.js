const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  let uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/safe_passage';

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'safe_passage',
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.warn(`[Database Warning] Could not connect to MongoDB at ${uri.replace(/:([^:@]+)@/, ':****@')}.`);
    console.warn(`[Database Warning] Reason: ${error.message}`);
    console.warn(`[Database Notice] Operating in dual-mode fallback state.`);
    return null;
  }
};

const getDBStatus = () => ({
  connected: isConnected,
  host: isConnected ? mongoose.connection.host : 'Disconnected / In-Memory Mock Mode',
  dbName: isConnected ? mongoose.connection.name : 'None',
});

module.exports = { connectDB, getDBStatus };
