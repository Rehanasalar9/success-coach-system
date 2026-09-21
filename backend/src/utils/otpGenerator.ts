import crypto from 'crypto';

/**
 * Generate a random 6-digit numeric OTP
 */
export const generate6DigitOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash an OTP code using SHA-256
 */
export const hashOtp = (otp: string): string => {
  const salt = process.env.JWT_SECRET || 'success_coach_otp_salt';
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
};

/**
 * Verify a plain OTP against a hashed OTP
 */
export const verifyOtpHash = (otp: string, hash: string): boolean => {
  const computedHash = hashOtp(otp);
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
};
