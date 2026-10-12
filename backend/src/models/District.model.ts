import { Schema, model, Document, Types } from 'mongoose';

export interface IDistrict extends Document {
  name: string;      // e.g. "Raipur"
  nameHindi: string; // e.g. "रायपुर"
  slug: string;      // e.g. "raipur"
  stateId: Types.ObjectId;
  createdAt: Date;
}

const DistrictSchema = new Schema<IDistrict>({
  name: { type: String, required: true, trim: true },
  nameHindi: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  stateId: { type: Schema.Types.ObjectId, ref: 'State', required: true, index: true },
}, { timestamps: true });

DistrictSchema.index({ slug: 1, stateId: 1 });

export const District = model<IDistrict>('District', DistrictSchema);

