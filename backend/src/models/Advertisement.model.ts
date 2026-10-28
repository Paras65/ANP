import { Schema, model, Document } from 'mongoose';

export type AdPlacement = 'header_top' | 'in_feed' | 'article_bottom' | 'sidebar' | 'popup_interstitial';

export interface IAdvertisement extends Document {
  title: string;
  clientName: string;
  clientPhone?: string;
  imageUrl: string;
  linkUrl: string;
  placement: AdPlacement;
  targetDistrict: string;
  startDate?: Date;
  expiryDate?: Date;
  isActive: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementSchema = new Schema<IAdvertisement>({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  clientName: { type: String, required: true, trim: true, maxlength: 100 },
  clientPhone: { type: String, trim: true, maxlength: 20 },
  imageUrl: { type: String, required: true, trim: true },
  linkUrl: { type: String, required: true, trim: true },
  placement: { 
    type: String, 
    required: true, 
    enum: ['header_top', 'in_feed', 'article_bottom', 'sidebar', 'popup_interstitial'],
    default: 'in_feed',
    index: true
  },
  targetDistrict: { type: String, default: 'सभी 88 जिले', trim: true },
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true, index: true },
  priority: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 }
}, { timestamps: true });

AdvertisementSchema.index({ placement: 1, isActive: 1, priority: -1 });

export const Advertisement = model<IAdvertisement>('Advertisement', AdvertisementSchema);
