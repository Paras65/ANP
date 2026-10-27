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
  caption: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: [500, 'कैप्शन अधिकतम 500 अक्षरों का हो सकता है']
  },
  imageUrl: { 
    type: String, 
    required: true,
    maxlength: [2048, 'इमेज URL अधिकतम 2048 अक्षरों का हो सकता है'],
    validate: {
      validator: function(v: string) {
        if (!v) return true;
        return !v.startsWith('data:');
      },
      message: 'Base64 छवियां डेटाबेस में अस्वीकृत हैं'
    }
  },
  youtubeId: { type: String, trim: true, maxlength: 50 },
  embedUrl: { type: String, maxlength: 2048 },
  postUrl: { type: String, required: true, maxlength: 2048 },
  likes: { type: String, default: '1.2K', maxlength: 30 },
  commentsCount: { type: String, default: '45', maxlength: 30 },
  sharesCount: { type: String, default: '18', maxlength: 30 },
  district: { type: String, default: 'कवर्धा', maxlength: 100 },
  timeAgo: { type: String, default: 'अभी-अभी', maxlength: 50 },
  audioTrack: { type: String, default: 'Ambition News Original', maxlength: 200 }
}, { timestamps: true });

ReelSchema.index({ createdAt: -1 });

export const Reel = model<IReel>('Reel', ReelSchema);
