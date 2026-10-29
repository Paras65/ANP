import { Schema, model, Document } from 'mongoose';

export interface IReelComment {
  _id?: any;
  user: string;
  text: string;
  timeAgo?: string;
  avatar?: string;
  createdAt?: Date;
}

export interface IReel extends Document {
  caption: string;
  imageUrl: string;
  videoUrl?: string;
  youtubeId?: string;
  embedUrl?: string;
  postUrl: string;
  likes: string;
  likesCount: number;
  commentsCount?: string;
  sharesCount?: string;
  comments: IReelComment[];
  district: string;
  timeAgo: string;
  audioTrack?: string;
  publishedAt?: Date;
  createdAt: Date;
}

const CommentSubSchema = new Schema<IReelComment>({
  user: { type: String, required: true, trim: true, maxlength: 100 },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  timeAgo: { type: String, default: 'अभी-अभी', maxlength: 50 },
  avatar: { type: String, default: '👤', maxlength: 20 },
  createdAt: { type: Date, default: Date.now }
});

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
  videoUrl: { type: String, trim: true, maxlength: 2048 },
  youtubeId: { type: String, trim: true, maxlength: 50 },
  embedUrl: { type: String, maxlength: 2048 },
  postUrl: { type: String, required: true, maxlength: 2048 },
  likes: { type: String, default: '1.2K', maxlength: 30 },
  likesCount: { type: Number, default: 1200 },
  commentsCount: { type: String, default: '45', maxlength: 30 },
  sharesCount: { type: String, default: '18', maxlength: 30 },
  comments: { type: [CommentSubSchema], default: [] },
  district: { type: String, default: 'कवर्धा', maxlength: 100 },
  timeAgo: { type: String, default: 'अभी-अभी', maxlength: 50 },
  audioTrack: { type: String, default: 'Ambition News Original', maxlength: 200 },
  publishedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

ReelSchema.index({ publishedAt: -1, createdAt: -1 });
ReelSchema.index({ createdAt: -1 });

export const Reel = model<IReel>('Reel', ReelSchema);
