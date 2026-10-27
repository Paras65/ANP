import { Schema, model, Document, Types } from 'mongoose';

export type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

export interface IArticle extends Document {
  title: string;
  titleEn?: string;
  slug: string;
  excerpt: string;
  content: any; // TipTap JSON or rich formatted text
  coverImage?: string;
  stateId: Types.ObjectId;
  districtId: Types.ObjectId;
  categoryId: Types.ObjectId;
  authorId: Types.ObjectId;
  tags: string[];
  status: ArticleStatus;
  isBreaking: boolean;
  isFeatured: boolean;
  views: number;
  rejectedNote?: string;
  publishedAt?: Date;
  deletedAt?: Date; // Soft delete
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>({
  title: { 
    type: String, 
    required: [true, 'शीर्षक आवश्यक है'], 
    trim: true,
    maxlength: [300, 'शीर्षक अधिकतम 300 अक्षरों का हो सकता है']
  },
  titleEn: { 
    type: String, 
    trim: true,
    maxlength: [300, 'अंग्रेजी शीर्षक अधिकतम 300 अक्षरों का हो सकता है']
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    maxlength: [150, 'स्लग अधिकतम 150 अक्षरों का हो सकता है']
  },
  excerpt: { 
    type: String, 
    required: [true, 'संक्षिप्त विवरण आवश्यक है'], 
    trim: true,
    maxlength: [1000, 'संक्षिप्त विवरण अधिकतम 1000 अक्षरों का हो सकता है']
  },
  content: { 
    type: Schema.Types.Mixed, 
    required: [true, 'विस्तृत सामग्री आवश्यक है'],
    validate: {
      validator: function(v: any) {
        if (typeof v === 'string') return v.length <= 60000;
        if (typeof v === 'object' && v !== null) {
          try {
            return JSON.stringify(v).length <= 80000;
          } catch {
            return false;
          }
        }
        return true;
      },
      message: 'सामग्री का आकार डेटाबेस सीमा (60KB) से अधिक है'
    }
  },
  coverImage: { 
    type: String,
    maxlength: [2048, 'छवि URL अधिकतम 2048 अक्षरों का हो सकता है'],
    validate: {
      validator: function(v: string) {
        if (!v) return true;
        // Strictly block Base64 image bombs from exhausting MongoDB Atlas storage
        if (v.startsWith('data:image/') || v.startsWith('data:application/')) return false;
        return v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/');
      },
      message: 'Base64 छवियां डेटाबेस में अस्वीकृत हैं। कृपया मान्य छवि URL का उपयोग करें।'
    }
  },
  stateId: { type: Schema.Types.ObjectId, ref: 'State', required: true, index: true },
  districtId: { type: Schema.Types.ObjectId, ref: 'District', required: true, index: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tags: {
    type: [{ 
      type: String, 
      trim: true, 
      maxlength: [60, 'टैग अधिकतम 60 अक्षरों का हो सकता है'] 
    }],
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 20;
      },
      message: 'अधिकतम 20 टैग की अनुमति है'
    }
  },
  status: { 
    type: String, 
    enum: ['DRAFT', 'REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'], 
    default: 'DRAFT',
    index: true
  },
  isBreaking: { type: Boolean, default: false, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  views: { type: Number, default: 0, min: 0, max: 100000000 },
  rejectedNote: { type: String, maxlength: [500, 'अस्वीकृति नोट अधिकतम 500 अक्षरों का हो सकता है'] },
  publishedAt: { type: Date, index: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

// Compound indexes for rapid high-traffic query optimization
ArticleSchema.index({ status: 1, publishedAt: -1, deletedAt: 1 });
ArticleSchema.index({ districtId: 1, status: 1, publishedAt: -1 });
ArticleSchema.index({ categoryId: 1, status: 1, publishedAt: -1 });
ArticleSchema.index({ isBreaking: 1, status: 1 });

// Full text search index in Hindi and English
ArticleSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

export const Article = model<IArticle>('Article', ArticleSchema);
