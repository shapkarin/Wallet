import { hash, verify } from 'argon2-browser';

export interface EncryptionResult {
  encrypted: string;
  salt: string;
}

export interface PasswordHashResult {
  hash: string;
  salt: string;
}

const ARGON2_CONFIG = {
  time: 3,
  mem: 65536,
  hashLen: 32,
  parallelism: 1,
  type: 0,
};

export const generateSalt = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const encryptWithArgon2 = async (
  data: string,
  password: string
): Promise<EncryptionResult> => {
  const salt = generateSalt();
  const saltBuffer = new TextEncoder().encode(salt);
  
  const result = await hash({
    pass: password,
    salt: saltBuffer,
    ...ARGON2_CONFIG,
  });

  const key = new Uint8Array(result.hash);
  const dataBuffer = new TextEncoder().encode(data);
  const encrypted = new Uint8Array(dataBuffer.length);
  
  for (let i = 0; i < dataBuffer.length; i++) {
    encrypted[i] = dataBuffer[i] ^ key[i % key.length];
  }

  return {
    encrypted: Array.from(encrypted, byte => byte.toString(16).padStart(2, '0')).join(''),
    salt,
  };
};

export const decryptWithArgon2 = async (
  encryptedData: string,
  password: string,
  salt: string
): Promise<string> => {
  const saltBuffer = new TextEncoder().encode(salt);
  
  const result = await hash({
    pass: password,
    salt: saltBuffer,
    ...ARGON2_CONFIG,
  });

  const key = new Uint8Array(result.hash);
  const encryptedBuffer = new Uint8Array(
    encryptedData.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  
  const decrypted = new Uint8Array(encryptedBuffer.length);
  
  for (let i = 0; i < encryptedBuffer.length; i++) {
    decrypted[i] = encryptedBuffer[i] ^ key[i % key.length];
  }

  return new TextDecoder().decode(decrypted);
};

export const hashPassword = async (password: string): Promise<PasswordHashResult> => {
  const salt = generateSalt();
  const saltBuffer = new TextEncoder().encode(salt);
  
  const result = await hash({
    pass: password,
    salt: saltBuffer,
    ...ARGON2_CONFIG,
  });

  return {
    hash: Array.from(new Uint8Array(result.hash), byte => 
      byte.toString(16).padStart(2, '0')
    ).join(''),
    salt,
  };
};

export const verifyPassword = async (
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> => {
  const saltBuffer = new TextEncoder().encode(salt);
  
  try {
    const result = await hash({
      pass: password,
      salt: saltBuffer,
      ...ARGON2_CONFIG,
    });

    const computedHash = Array.from(new Uint8Array(result.hash), byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');

    return computedHash === storedHash;
  } catch {
    return false;
  }
};

export const deriveKeyFromPassword = async (
  password: string,
  salt: string
): Promise<Uint8Array> => {
  const saltBuffer = new TextEncoder().encode(salt);
  
  const result = await hash({
    pass: password,
    salt: saltBuffer,
    ...ARGON2_CONFIG,
  });

  return new Uint8Array(result.hash);
};
