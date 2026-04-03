const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mediguide');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // In test mode, fall back to an in-memory database so Jest suites can run without a real MongoDB.
    if (process.env.NODE_ENV === 'production') {
      // In production a missing DB is a fatal misconfiguration — fail loudly.
      console.error(`FATAL: MongoDB connection failed — ${error.message}`);
      process.exit(1);
    } else {
      // In development / test fall back to an in-memory database.
      // WARNING: data is ephemeral and is lost on restart. Do NOT rely on this in production.
      console.warn('⚠  WARNING: MongoDB unavailable — falling back to in-memory database.');
      console.warn('   Data will be lost when the server restarts. Set MONGO_URI to persist data.');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        const conn = await mongoose.connect(mongoUri);
        console.log(`In-memory MongoDB Connected: ${conn.connection.host}`);
      } catch (memError) {
        console.error(`Error starting in-memory DB: ${memError.message}`);
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
