import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ambition_news';
    await mongoose.connect(connStr, {
      maxPoolSize: 20, // Prevents Atlas connection exhaustion on burst traffic
      minPoolSize: 5,  // Keeps warmed connections ready
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4 to prevent IPv6 DNS lookup delays on cloud hosts
    });
    console.log('✅ [Database] MongoDB Atlas Connected Successfully (Pool: 20, IPv4)');
  } catch (error: any) {
    console.error('❌ [Database] Connection Failed:', error.message || error);
  }
};

