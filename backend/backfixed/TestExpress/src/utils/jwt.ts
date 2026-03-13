import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { AppError } from './AppError';

const accessSecret: Secret = process.env.JWT_ACCESS_SECRET || 'access_secret';
const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
const resetSecret: Secret = process.env.JWT_RESET_SECRET || 'reset_secret';

export const signAccessToken = (payload: object) => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, accessSecret, options);
};

export const signRefreshToken = (payload: object) => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, refreshSecret, options);
};

export const signResetToken = (payload: object) => {
  const options: SignOptions = {
    expiresIn: '15m',
  };

  return jwt.sign(payload, resetSecret, options);
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, accessSecret);
  } catch {
    throw new AppError('Invalid access token', 401);
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, refreshSecret);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
};

export const verifyResetToken = (token: string) => {
  try {
    return jwt.verify(token, resetSecret);
  } catch {
    throw new AppError('Invalid reset token', 401);
  }
};