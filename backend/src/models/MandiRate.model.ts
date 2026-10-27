import { Schema, model, Document } from 'mongoose';

export interface IMandiRate extends Document {
  crop: string;
  mandi: string;
  state: string;
  rate: number;
  unit: string;
  change: 'up' | 'down' | 'steady';
  diff: number;
  updatedAt: Date;
  createdAt: Date;
}

const MandiRateSchema = new Schema<IMandiRate>({
  crop: { type: String, required: true, trim: true },
  mandi: { type: String, required: true, trim: true },
  state: { type: String, default: 'CG', trim: true },
  rate: { type: Number, required: true },
  unit: { type: String, default: '₹/क्विंटल', trim: true },
  change: { type: String, enum: ['up', 'down', 'steady'], default: 'steady' },
  diff: { type: Number, default: 0 }
}, { timestamps: true });

MandiRateSchema.index({ crop: 1, mandi: 1 });

export const MandiRate = model<IMandiRate>('MandiRate', MandiRateSchema);
