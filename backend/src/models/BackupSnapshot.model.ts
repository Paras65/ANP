import { Schema, model, Document } from 'mongoose';

export interface IBackupSnapshot extends Document {
  name: string;
  type: 'AUTOMATED_DAILY' | 'MANUAL_ON_DEMAND' | 'PRE_MIGRATION';
  counts: {
    articles: number;
    mandiRates: number;
    reporters: number;
    videos: number;
    reels: number;
    advertisements: number;
  };
  totalRecords: number;
  payloadJson: string; // Serialized JSON of full database snapshot
  sizeBytes: number;
  createdBy: string;
  createdAt: Date;
}

const BackupSnapshotSchema = new Schema<IBackupSnapshot>({
  name: { type: String, required: true, maxlength: 100 },
  type: { 
    type: String, 
    enum: ['AUTOMATED_DAILY', 'MANUAL_ON_DEMAND', 'PRE_MIGRATION'], 
    default: 'MANUAL_ON_DEMAND',
    index: true 
  },
  counts: {
    articles: { type: Number, default: 0 },
    mandiRates: { type: Number, default: 0 },
    reporters: { type: Number, default: 0 },
    videos: { type: Number, default: 0 },
    reels: { type: Number, default: 0 },
    advertisements: { type: Number, default: 0 }
  },
  totalRecords: { type: Number, default: 0 },
  payloadJson: { type: String, required: true },
  sizeBytes: { type: Number, default: 0 },
  createdBy: { type: String, default: 'super_admin' },
  createdAt: { 
    type: Date, 
    default: Date.now,
    // Automatically purge snapshots older than 14 days to prevent storage exhaustion
    expires: 14 * 24 * 60 * 60
  }
}, { timestamps: false });

BackupSnapshotSchema.index({ createdAt: -1 });

export const BackupSnapshot = model<IBackupSnapshot>('BackupSnapshot', BackupSnapshotSchema);
