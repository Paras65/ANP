import { Schema, model, Document } from 'mongoose';

export interface IReel extends Document {
  caption: string;
  imageUrl: string;
  youtubeId?: string;
  embedUrl?: string;
  postUrl: string;
  likes: string;
  commentsCount?: string;
  sharesCount?: string;
  district: string;
  timeAgo: string;
  audioTrack?: string;
  createdAt: Date;
}

const ReelSchema = new Schema<IReel>({
  caption: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true },
  youtubeId: { type: String, trim: true },
  embedUrl: { type: String },
  postUrl: { type: String, required: true },
  likes: { type: String, default: '1.2K' },
  commentsCount: { type: String, default: '45' },
  sharesCount: { type: String, default: '18' },
  district: { type: String, default: 'कवर्धा' },
  timeAgo: { type: String, default: 'अभी-अभी' },
  audioTrack: { type: String, default: 'Ambition News Original' }
}, { timestamps: true });

ReelSchema.index({ createdAt: -1 });

export const Reel = model<IReel>('Reel', ReelSchema);

