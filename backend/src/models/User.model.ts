import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'READER' | 'REPORTER' | 'EDITOR' | 'ADMIN';

export interface IUser extends Document {
  phone: string;
  name: string;
  nameHindi?: string;
  role: UserRole;
  bureau?: string;
  photoUrl?: string;
  districtId?: Types.ObjectId;
  reporterIdCode?: string; // e.g. "ANP-CG-KBR-01" for digital press card
  isActive: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  phone: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  nameHindi: { type: String, trim: true },
  bureau: { type: String, trim: true },
  photoUrl: { type: String, trim: true },
  role: { 
    type: String, 
    enum: ['READER', 'REPORTER', 'EDITOR', 'ADMIN'], 
    default: 'READER', 
    index: true 
  },
  districtId: { type: Schema.Types.ObjectId, ref: 'District' },
  reporterIdCode: { type: String, sparse: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const User = model<IUser>('User', UserSchema);

