import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ambition_news';
    await mongoose.connect(connStr);
    console.log('✅ [Database] MongoDB Atlas Connected Successfully');
  } catch (error: any) {
    console.error('❌ [Database] Connection Failed:', error.message || error);
  }
};

