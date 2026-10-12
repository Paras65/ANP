import { Schema, model, Document } from 'mongoose';

export interface IState extends Document {
  name: string;      // e.g. "Chhattisgarh"
  nameHindi: string; // e.g. "छत्तीसगढ़"
  slug: string;      // e.g. "chhattisgarh"
  createdAt: Date;
}

const StateSchema = new Schema<IState>({
  name: { type: String, required: true, unique: true, trim: true },
  nameHindi: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
}, { timestamps: true });

export const State = model<IState>('State', StateSchema);

