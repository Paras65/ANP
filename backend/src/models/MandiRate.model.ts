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
  crop: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: [100, 'फसल का नाम अधिकतम 100 अक्षरों का हो सकता है']
  },
  mandi: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: [100, 'मंडी का नाम अधिकतम 100 अक्षरों का हो सकता है']
  },
  state: { 
    type: String, 
    default: 'CG', 
    trim: true,
    maxlength: [10, 'राज्य कोड अधिकतम 10 अक्षरों का हो सकता है']
  },
  rate: { 
    type: Number, 
    required: true,
    min: [0, 'भाव 0 से कम नहीं हो सकता'],
    max: [1000000, 'भाव 10,00,000 से अधिक नहीं हो सकता']
  },
  unit: { 
    type: String, 
    default: '₹/क्विंटल', 
    trim: true,
    maxlength: [30, 'इकाई अधिकतम 30 अक्षरों की हो सकती है']
  },
  change: { 
    type: String, 
    enum: ['up', 'down', 'steady'], 
    default: 'steady' 
  },
  diff: { 
    type: Number, 
    default: 0,
    min: [-100000, 'अंतर न्यूनतम सीमा से कम है'],
    max: [100000, 'अंतर अधिकतम सीमा से अधिक है']
  }
}, { timestamps: true });

MandiRateSchema.index({ crop: 1, mandi: 1 });

export const MandiRate = model<IMandiRate>('MandiRate', MandiRateSchema);
