import crypto from 'crypto';

export const generateEmailToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateTokenExpiry = (hours: number = 24): Date => {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};