import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ambition_news';
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('✅ [Database] MongoDB Atlas Connected Successfully');
  } catch (error: any) {
    console.error('❌ [Database] Connection Failed (using mock fallback store):', error.message || error);
    // In dev without active internet/DB, don't crash whole process so server can still serve health check
  }
};

