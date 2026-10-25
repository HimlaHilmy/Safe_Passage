const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/safe_passage';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging indefinitely
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.warn(`[Database Warning] Could not connect to MongoDB at ${uri}.`);
    console.warn(`[Database Warning] Reason: ${error.message}`);
    console.warn(`[Database Notice] Backend will operate with in-memory fallback state so developers can test UI/APIs before starting local MongoDB daemon.`);
    return null;
  }
};

const getDBStatus = () => ({
  connected: isConnected,
  host: isConnected ? mongoose.connection.host : 'Disconnected / In-Memory Mock Mode',
  dbName: isConnected ? mongoose.connection.name : 'None',
});

module.exports = { connectDB, getDBStatus };
