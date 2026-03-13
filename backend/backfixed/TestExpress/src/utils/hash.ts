import crypto from 'crypto';

const SCRYPT_KEYLEN = 64;

export const hashValue = async (value: string): Promise<string> => {
  const salt = crypto.randomBytes(16).toString('hex');

  return new Promise((resolve, reject) => {
    crypto.scrypt(value, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
};

export const compareHash = async (value: string, storedHash: string): Promise<boolean> => {
  const [salt, key] = storedHash.split(':');

  return new Promise((resolve, reject) => {
    crypto.scrypt(value, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
    });
  });
};

export const hashPassword = hashValue;
export const verifyPassword = compareHash;
export const hashToken = hashValue;