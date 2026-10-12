import { Schema, model, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;      // e.g. "राजनीति"
  nameEn: string;    // e.g. "Politics"
  slug: string;      // e.g. "rajniti"
  icon?: string;     // e.g. "🏛️"
  color?: string;    // e.g. "#dc2626"
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true, trim: true },
  nameEn: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  icon: { type: String, default: '📰' },
  color: { type: String, default: '#dc2626' },
}, { timestamps: true });

export const Category = model<ICategory>('Category', CategorySchema);

