const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mediguide', {
        serverSelectionTimeoutMS: 2000 // Very short timeout to quickly fallback
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Regular MongoDB connection failed. Starting in-memory database for testing...`);
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
};

module.exports = connectDB;
