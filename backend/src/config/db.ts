import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

const sanitizeErrorMsg = (msg: string): string => {
  return msg.replace(/mongodb(\+srv)?:\/\/[^\s@]+@/gi, 'mongodb$1://[REDACTED_CREDENTIALS]@');
};

export const connectDB = async (): Promise<void> => {
  const useInMemory = process.env.USE_IN_MEMORY_DB === 'true';

  if (useInMemory) {
    try {
      console.log('⚡ Launching in-memory MongoDB server for testing/development...');
      mongoMemoryServer = await MongoMemoryServer.create();
      const mongoUri = mongoMemoryServer.getUri();
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to In-Memory MongoDB');
      return;
    } catch (err: any) {
      console.error('❌ In-Memory Database connection error:', sanitizeErrorMsg(err.message || String(err)));
      process.exit(1);
    }
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/success_coach_db';
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected successfully to persistent MongoDB database');
  } catch (error: any) {
    const sanitized = sanitizeErrorMsg(error.message || String(error));
    console.error('❌ MongoDB persistent connection error:', sanitized);
    throw error;
  }
};

export const closeDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

