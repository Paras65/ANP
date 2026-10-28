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
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: [300, 'वीडियो शीर्षक अधिकतम 300 अक्षरों का हो सकता है']
  },
  youtubeId: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    index: true,
    maxlength: [50, 'YouTube ID अधिकतम 50 अक्षरों की हो सकती है']
  },
  thumbnail: { 
    type: String, 
    required: true,
    maxlength: [2048, 'थंबनेल URL अधिकतम 2048 अक्षरों का हो सकता है'],
    validate: {
      validator: function(v: string) {
        if (!v) return true;
        return !v.startsWith('data:');
      },
      message: 'Base64 थंबनेल डेटाबेस में अस्वीकृत हैं'
    }
  },
  duration: { type: String, default: '10:00', maxlength: 30 },
  views: { type: String, default: '1', maxlength: 30 },
  timeAgo: { type: String, default: 'अभी-अभी', maxlength: 50 },
  category: { type: String, default: 'कवर्धा विशेष', maxlength: 100 },
  youtubeUrl: { type: String, required: true, maxlength: 2048 },
  publishedAt: { type: Date, default: Date.now },
  isShort: { type: Boolean, default: false }
}, { timestamps: true });

VideoSchema.index({ publishedAt: -1 });
VideoSchema.index({ isShort: 1, publishedAt: -1 });

export const Video = model<IVideo>('Video', VideoSchema);
