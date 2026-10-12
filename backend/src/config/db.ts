import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ambition_news';
    await mongoose.connect(connStr);
    console.log('✅ [Database] MongoDB Atlas Connected Successfully');
  } catch (error) {
    console.error('❌ [Database] Connection Failed:', error);
    // In dev without active internet/DB, don't crash whole process so server can still serve health check
  }
};

