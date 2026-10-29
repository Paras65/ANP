import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to RFC 4648 Base32 string (without padding)
 */
export function base32Encode(buffer: Buffer): string {
  let bits = '';
  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, '0');
  }

  let base32 = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    if (chunk.length < 5) {
      base32 += BASE32_ALPHABET[parseInt(chunk.padEnd(5, '0'), 2)];
    } else {
      base32 += BASE32_ALPHABET[parseInt(chunk, 2)];
    }
  }

  return base32;
}

/**
 * Decodes an RFC 4648 Base32 string to Buffer
 */
export function base32Decode(str: string): Buffer {
  const cleaned = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

/**
 * Generates a random Base32 secret key for TOTP (160 bits / 20 bytes standard)
 */
export function generateBase32Secret(byteLength: number = 20): string {
  const randomBytes = crypto.randomBytes(byteLength);
  return base32Encode(randomBytes);
}

/**
 * Generates an RFC 6238 TOTP 6-digit code for a given secret at current time
 */
export function generateTOTP(secret: string, timeStepSeconds: number = 30): string {
  const counter = Math.floor(Date.now() / 1000 / timeStepSeconds);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));

  const key = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return String(otp).padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code against a secret key with a +/- window for clock drift tolerance
 */
export function verifyTOTP(
  candidateCode: string,
  secret: string,
  windowSteps: number = 1,
  timeStepSeconds: number = 30
): boolean {
  const cleanCode = String(candidateCode).replace(/\s/g, '').trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    return false;
  }

  const currentCounter = Math.floor(Date.now() / 1000 / timeStepSeconds);
  const key = base32Decode(secret);

  for (let i = -windowSteps; i <= windowSteps; i++) {
    const counter = currentCounter + i;
    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = String(binary % 1000000).padStart(6, '0');
    if (crypto.timingSafeEqual(Buffer.from(otp), Buffer.from(cleanCode))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates an otpauth:// URL for Google Authenticator / Microsoft Authenticator QR code
 */
export function getOtpAuthUrl(secret: string, account: string = 'admin', issuer: string = 'AmbitionNews'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates Emergency Single-Use Offline Backup Recovery Codes
 * Example format: "ANP-8392", "ANP-1049"
 */
export function generateEmergencyBackupCodes(count: number = 5): { rawCodes: string[]; hashedCodes: string[] } {
  const rawCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const code = `ANP-${randomHex.slice(0, 4)}-${randomHex.slice(4, 8)}`;
    rawCodes.push(code);

    const hash = crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
    hashedCodes.push(hash);
  }

  return { rawCodes, hashedCodes };
}

/**
 * Verifies an emergency recovery code against stored SHA-256 hashes
 * Returns index of used code or -1 if invalid
 */
export function verifyAndConsumeBackupCode(candidate: string, hashedCodes: string[]): number {
  const clean = candidate.trim().toUpperCase();
  const candidateHash = crypto.createHash('sha256').update(clean).digest('hex');

  for (let i = 0; i < hashedCodes.length; i++) {
    if (hashedCodes[i] === candidateHash) {
      return i; // Valid backup code found at index
    }
  }

  return -1;
}
