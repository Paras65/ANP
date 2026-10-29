import { Setting } from '../models/Setting.model.js';
import { 
  generateBase32Secret, 
  generateEmergencyBackupCodes, 
  verifyTOTP, 
  verifyAndConsumeBackupCode, 
  getOtpAuthUrl 
} from '../utils/totp.js';

export interface TwoFactorStatus {
  enabled: boolean;
  remainingBackupCodes: number;
  enabledAt: string | null;
}

export interface TwoFactorSetupData {
  secret: string;
  otpAuthUrl: string;
  emergencyBackupCodes: string[];
}

export interface VerifyCodeResult {
  valid: boolean;
  isBackupCode: boolean;
  remainingBackupCodes: number;
  message?: string;
}

/**
 * Unified Two-Factor Authentication (2FA) Service
 * DRY implementation used across Editorial Admin & Super Admin desks (RFC 6238 TOTP).
 */
export class TwoFactorService {
  /**
   * Retrieves current 2FA status and remaining backup codes
   */
  static async getStatus(settingKey: string): Promise<TwoFactorStatus> {
    const setting = await Setting.findOne({ key: settingKey }).lean();
    return {
      enabled: Boolean(setting?.value?.enabled && setting?.value?.secret),
      remainingBackupCodes: setting?.value?.hashedBackupCodes?.length || 0,
      enabledAt: setting?.value?.enabledAt || null
    };
  }

  /**
   * Starts a new 2FA setup process: generates Base32 secret & 5 hashed backup codes
   */
  static async startSetup(pendingKey: string, accountLabel: string): Promise<TwoFactorSetupData> {
    const secret = generateBase32Secret(20);
    const otpAuthUrl = getOtpAuthUrl(secret, accountLabel, 'AmbitionNews');
    const { rawCodes, hashedCodes } = generateEmergencyBackupCodes(5);

    await Setting.findOneAndUpdate(
      { key: pendingKey },
      {
        key: pendingKey,
        value: { secret, hashedBackupCodes: hashedCodes, createdAt: new Date() }
      },
      { upsert: true, new: true }
    );

    return {
      secret,
      otpAuthUrl,
      emergencyBackupCodes: rawCodes
    };
  }

  /**
   * Verifies the initial test OTP code and activates 2FA permanently
   */
  static async verifyAndEnable(activeKey: string, pendingKey: string, code: string): Promise<boolean> {
    const pending = await Setting.findOne({ key: pendingKey });
    if (!pending?.value?.secret) {
      throw new Error('कोई लंबित 2FA सेटअप नहीं मिला। कृपया पुनः सेटअप प्रारंभ करें।');
    }

    const isValid = verifyTOTP(String(code).trim(), pending.value.secret);
    if (!isValid) {
      return false;
    }

    await Setting.findOneAndUpdate(
      { key: activeKey },
      {
        key: activeKey,
        value: {
          enabled: true,
          secret: pending.value.secret,
          hashedBackupCodes: pending.value.hashedBackupCodes || [],
          enabledAt: new Date()
        }
      },
      { upsert: true }
    );

    await Setting.deleteOne({ key: pendingKey });
    return true;
  }

  /**
   * Verifies a 6-digit TOTP code or single-use offline recovery code during login
   */
  static async verifyCodeOrBackup(settingKey: string, inputCode: string): Promise<VerifyCodeResult> {
    const setting = await Setting.findOne({ key: settingKey });
    if (!setting?.value?.enabled || !setting.value.secret) {
      return { valid: false, isBackupCode: false, remainingBackupCodes: 0, message: '2FA सक्रिय नहीं है' };
    }

    const code = String(inputCode).trim();

    // 1. Check dynamic 6-digit TOTP
    if (verifyTOTP(code, setting.value.secret)) {
      return {
        valid: true,
        isBackupCode: false,
        remainingBackupCodes: setting.value.hashedBackupCodes?.length || 0
      };
    }

    // 2. Check emergency single-use backup recovery code
    const hashedCodes = setting.value.hashedBackupCodes || [];
    const usedIndex = verifyAndConsumeBackupCode(code, hashedCodes);
    if (usedIndex !== -1) {
      hashedCodes.splice(usedIndex, 1);
      setting.value.hashedBackupCodes = hashedCodes;
      setting.markModified('value');
      await setting.save();

      return {
        valid: true,
        isBackupCode: true,
        remainingBackupCodes: hashedCodes.length
      };
    }

    return {
      valid: false,
      isBackupCode: false,
      remainingBackupCodes: hashedCodes.length,
      message: 'अमान्य 2FA कोड या समाप्त बैकअप कोड'
    };
  }

  /**
   * Disables 2FA security
   */
  static async disable(settingKey: string): Promise<void> {
    await Setting.findOneAndUpdate(
      { key: settingKey },
      { key: settingKey, value: { enabled: false } },
      { upsert: true }
    );
  }
}
