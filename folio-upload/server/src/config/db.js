import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';

// Reuse one connection (and any in-flight connection attempt) per warm
// serverless instance. Vercel may invoke the Express app without running
// src/index.js, so the app itself must ensure the database is connected.
let connectionPromise;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set.');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    }).catch((err) => {
      // Allow a later request to retry if Atlas was temporarily unavailable.
      connectionPromise = undefined;
      throw err;
    });
  }

  await connectionPromise;
  console.log('MongoDB connected');
  return mongoose.connection;
}
