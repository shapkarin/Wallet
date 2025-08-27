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

export const generateSalt = (): string => {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Secure random number generation not available');
  }
  
  const array = new Uint8Array(32);
  const randomValues = crypto.getRandomValues(array);
  return Array.from(randomValues, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const generateIV = (): string => {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Secure random number generation not available');
  }
  
  const array = new Uint8Array(12);
  const randomValues = crypto.getRandomValues(array);
  return Array.from(randomValues, byte => byte.toString(16).padStart(2, '0')).join('');
};

const deriveKeyFromPassword = async (password: string, salt: string, extractable: boolean = false): Promise<CryptoKey> => {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const keyUsages = ['encrypt', 'decrypt'] as const;
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    extractable,
    keyUsages
  );
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
  
  const key = await deriveKeyFromPassword(password, salt);
  const dataBuffer = new TextEncoder().encode(data);
  const ivBuffer = new Uint8Array(iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    key,
    dataBuffer
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  const authTagStart = encryptedArray.length - 16;
  
  const authTag = Array.from(
    encryptedArray.slice(authTagStart),
    byte => byte.toString(16).padStart(2, '0')
  ).join('');
  
  const ciphertext = Array.from(
    encryptedArray.slice(0, authTagStart),
    byte => byte.toString(16).padStart(2, '0')
  ).join('');

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

  const key = await deriveKeyFromPassword(password, salt);
  
  const encryptedBuffer = new Uint8Array(
    encryptedData.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  const authTagBuffer = new Uint8Array(
    authTag.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  const ivBuffer = new Uint8Array(
    iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  const combinedBuffer = new Uint8Array(encryptedBuffer.length + authTagBuffer.length);
  combinedBuffer.set(encryptedBuffer);
  combinedBuffer.set(authTagBuffer, encryptedBuffer.length);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      key,
      combinedBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    throw new Error('Decryption failed - data may be corrupted or password incorrect');
  }
};

export const hashPassword = async (password: string): Promise<PasswordHashResult> => {
  const salt = generateSalt();
  const key = await deriveKeyFromPassword(password, salt, true);
  
  const keyBuffer = await window.crypto.subtle.exportKey('raw', key);
  const hash = Array.from(new Uint8Array(keyBuffer), byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');

  return { hash, salt };
};

export const verifyPassword = async (
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> => {
  try {
    const key = await deriveKeyFromPassword(password, salt, true);
    const keyBuffer = await window.crypto.subtle.exportKey('raw', key);
    const computedHash = Array.from(new Uint8Array(keyBuffer), byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');

    return computedHash === storedHash;
  } catch {
    return false;
  }
};

export const deriveKeyFromPasswordExport = async (
  password: string,
  salt: string
): Promise<Uint8Array> => {
  const key = await deriveKeyFromPassword(password, salt, true);
  const keyBuffer = await window.crypto.subtle.exportKey('raw', key);
  return new Uint8Array(keyBuffer);
};
