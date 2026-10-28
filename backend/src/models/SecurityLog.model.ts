import { Schema, model, Document } from 'mongoose';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ISecurityLog extends Document {
  eventType: string; // e.g., 'BASE64_PAYLOAD_FORBIDDEN', 'RATE_LIMIT_TRIPPED', 'PAYLOAD_TOO_LARGE', 'NOSQL_INJECTION_DEFLECTED', 'AUTH_FAILED'
  severity: SecuritySeverity;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  statusCode: number;
  message: string;
  details?: string;
  repeatCount: number;
  blocked: boolean;
  createdAt: Date;
}

const SecurityLogSchema = new Schema<ISecurityLog>({
  eventType: { 
    type: String, 
    required: true, 
    index: true,
    maxlength: 60 
  },
  severity: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 
    default: 'MEDIUM',
    index: true 
  },
  ip: { 
    type: String, 
    required: true, 
    index: true,
    maxlength: 64 
  },
  userAgent: { 
    type: String, 
    default: 'unknown',
    maxlength: 150 
  },
  method: { 
    type: String, 
    default: 'GET',
    maxlength: 10 
  },
  path: { 
    type: String, 
    default: '/',
    maxlength: 200 
  },
  statusCode: { 
    type: Number, 
    default: 400 
  },
  message: { 
    type: String, 
    required: true,
    maxlength: 500 
  },
  details: { 
    type: String,
    maxlength: 200 
  },
  repeatCount: { 
    type: Number, 
    default: 1,
    min: 1 
  },
  blocked: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    // Automatic TTL (Time-To-Live) index: Purges records older than 7 days automatically
    // This ensures security logs NEVER bloat or fill up MongoDB Atlas 512MB storage!
    expires: 7 * 24 * 60 * 60 // 7 days in seconds
  }
}, { timestamps: false });

SecurityLogSchema.index({ createdAt: -1 });
SecurityLogSchema.index({ eventType: 1, createdAt: -1 });
SecurityLogSchema.index({ ip: 1, createdAt: -1 });

export const SecurityLog = model<ISecurityLog>('SecurityLog', SecurityLogSchema);

