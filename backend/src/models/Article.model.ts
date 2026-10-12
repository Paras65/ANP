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
  title: { type: String, required: true, trim: true },
  titleEn: { type: String, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  excerpt: { type: String, required: true, trim: true },
  content: { type: Schema.Types.Mixed, required: true },
  coverImage: { type: String },
  stateId: { type: Schema.Types.ObjectId, ref: 'State', required: true, index: true },
  districtId: { type: Schema.Types.ObjectId, ref: 'District', required: true, index: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tags: [{ type: String }],
  status: { 
    type: String, 
    enum: ['DRAFT', 'REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'], 
    default: 'DRAFT',
    index: true
  },
  isBreaking: { type: Boolean, default: false, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  views: { type: Number, default: 0 },
  rejectedNote: { type: String },
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

