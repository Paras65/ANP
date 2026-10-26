import { Schema, model, Document } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  youtubeId: string;
  thumbnail: string;
  duration: string;
  views: string;
  timeAgo: string;
  category: string;
  youtubeUrl: string;
  publishedAt?: Date;
  isShort?: boolean;
  createdAt: Date;
}

const VideoSchema = new Schema<IVideo>({
  title: { type: String, required: true, trim: true },
  youtubeId: { type: String, required: true, unique: true, trim: true, index: true },
  thumbnail: { type: String, required: true },
  duration: { type: String, default: '10:00' },
  views: { type: String, default: '1' },
  timeAgo: { type: String, default: 'अभी-अभी' },
  category: { type: String, default: 'कवर्धा विशेष' },
  youtubeUrl: { type: String, required: true },
  publishedAt: { type: Date, default: Date.now },
  isShort: { type: Boolean, default: false }
}, { timestamps: true });

VideoSchema.index({ publishedAt: -1 });

export const Video = model<IVideo>('Video', VideoSchema);

