import argon2 from 'argon2-browser';

export interface EncryptionResult {
  encrypted: string;
  salt: string;
  iv: string;
  authTag: string;
}

export interface PasswordHashResult {
  hash: string;
  salt: string;
}

export const ARGON2_CONFIG = {
  time: 4,
  mem: 131072, // 128MB for better security
  hashLen: 32,
  parallelism: 2,
  type: 2, // Argon2id for better security against side-channel attacks
};

export const generateSalt = (): string => {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Secure random number generation not available');
  }
  
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const generateIV = (): string => {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Secure random number generation not available');
  }
  
  const array = new Uint8Array(12); // 96-bit IV for AES-GCM
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

const zeroizeArray = (array: Uint8Array): void => {
  for (let i = 0; i < array.length; i++) {
    array[i] = 0;
  }
};

export const encryptWithAESGCM = async (
  data: string,
  password: string
): Promise<EncryptionResult> => {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }

  const salt = generateSalt();
  const iv = generateIV();
  
  // Derive key using Argon2
  const saltBuffer = new TextEncoder().encode(salt);
  const argon2Result = await argon2.hash({
    pass: password,
    salt: saltBuffer,
    ...ARGON2_CONFIG,
  });

  // Import key for AES-GCM
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    argon2Result.hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt data
  const dataBuffer = new TextEncoder().encode(data);
  const ivBuffer = new Uint8Array(iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    keyMaterial,
    dataBuffer
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);

  // Extract auth tag (last 16 bytes)
  const authTagStart = encryptedArray.length - 16;
  const authTag = Array.from(
    encryptedArray.slice(authTagStart),
    byte => byte.toString(16).padStart(2, '0')
  ).join('');
  
  const ciphertext = Array.from(
    encryptedArray.slice(0, authTagStart),
    byte => byte.toString(16).padStart(2, '0')
  ).join('');

  // Zeroize sensitive data
  zeroizeArray(new Uint8Array(argon2Result.hash));
  zeroizeArray(dataBuffer);

  return {
    encrypted: ciphertext,
    salt,
    iv,
    authTag,
  };
};

export const decryptWithAESGCM = async (
  encryptedData: string,
  password: string,
  salt: string,
  iv: string,
  authTag: string
): Promise<string> => {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }

  // Derive key using Argon2
  const saltBuffer = new TextEncoder().encode(salt);
  const argon2Result = await argon2.hash({
    pass: password,
    salt: saltBuffer,
    ...ARGON2_CONFIG,
  });

  // Import key for AES-GCM
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    argon2Result.hash,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Prepare encrypted data with auth tag
  const encryptedBuffer = new Uint8Array(
    encryptedData.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  const authTagBuffer = new Uint8Array(
    authTag.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  const ivBuffer = new Uint8Array(
    iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  // Combine ciphertext and auth tag
  const combinedBuffer = new Uint8Array(encryptedBuffer.length + authTagBuffer.length);
  combinedBuffer.set(encryptedBuffer);
  combinedBuffer.set(authTagBuffer, encryptedBuffer.length);

  try {
    // Decrypt data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      keyMaterial,
      combinedBuffer
    );

    const decryptedData = new TextDecoder().decode(decryptedBuffer);

    // Zeroize sensitive data
    zeroizeArray(new Uint8Array(argon2Result.hash));
    zeroizeArray(new Uint8Array(decryptedBuffer));

    return decryptedData;
  } catch {
    // Zeroize sensitive data even on error
    zeroizeArray(new Uint8Array(argon2Result.hash));
    throw new Error('Decryption failed - data may be corrupted or password incorrect');
  }
};

// Legacy XOR encryption for backward compatibility
export const encryptWithArgon2 = async (
  data: string,
  password: string
): Promise<{ encrypted: string; salt: string }> => {
  const salt = generateSalt();
  const saltBuffer = new TextEncoder().encode(salt);
  
  const result = await argon2.hash({
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

  // Zeroize sensitive data
  zeroizeArray(key);
  zeroizeArray(dataBuffer);

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
  
  const result = await argon2.hash({
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

  const decryptedData = new TextDecoder().decode(decrypted);

  // Zeroize sensitive data
  zeroizeArray(key);
  zeroizeArray(decrypted);

  return decryptedData;
};

export const hashPassword = async (password: string): Promise<PasswordHashResult> => {
  const salt = generateSalt();
  const saltBuffer = new TextEncoder().encode(salt);
  
  const result = await argon2.hash({
    pass: password,
    salt: saltBuffer,
    ...ARGON2_CONFIG,
  });

  const hash = Array.from(new Uint8Array(result.hash), byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');

  // Zeroize sensitive data
  zeroizeArray(new Uint8Array(result.hash));

  return { hash, salt };
};

export const verifyPassword = async (
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> => {
  const saltBuffer = new TextEncoder().encode(salt);
  
  try {
    const result = await argon2.hash({
      pass: password,
      salt: saltBuffer,
      ...ARGON2_CONFIG,
    });

    const computedHash = Array.from(new Uint8Array(result.hash), byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');

    // Use constant-time comparison to prevent timing attacks
    const isValid = constantTimeCompare(computedHash, storedHash);

    // Zeroize sensitive data
    zeroizeArray(new Uint8Array(result.hash));

    return isValid;
  } catch {
    return false;
  }
};

export const deriveKeyFromPassword = async (
  password: string,
  salt: string
): Promise<Uint8Array> => {
  const saltBuffer = new TextEncoder().encode(salt);
  
  const result = await argon2.hash({
    pass: password,
    salt: saltBuffer,
    ...ARGON2_CONFIG,
  });

  return new Uint8Array(result.hash);
};
