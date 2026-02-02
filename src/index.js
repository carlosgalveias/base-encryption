import {
  generateRandomBytes,
  arrayBufferToHex,
  hexToArrayBuffer,
  stringToArrayBuffer,
  arrayBufferToString,
  deriveKey,
  hashData,
  getCrypto
} from './crypto-utils.js';

// Modern security constants
const PBKDF2_ITERATIONS = 600000; // Updated from 100 to modern standard (MAXIMUM for backward compatibility)
const SALT_SIZE = 16; // bytes
const IV_SIZE = 12;   // bytes for AES-GCM (not 16 for CBC)
const KEY_SIZE = 256; // bits

// Security level presets
const SECURITY_LEVELS = {
  maximum: 600000,    // OWASP 2023 compliant - for user passwords
  high: 100000,       // Strong security - for sensitive data
  standard: 10000,    // Balanced - for general use
  fast: 1000          // Fast API operations - for transport encryption
};

// HELPERS
function isObject(obj) {
  return obj && typeof obj === 'object';
}

function objToString(obj) {
  return isObject(obj) ? JSON.stringify(obj) : obj;
}

/**
 * One-way encryption using SHA-256 or MD5 hash
 * @param {string} data - Data to hash
 * @param {boolean} sha - Use SHA-256 if true, MD5 if false (default: true)
 * @returns {Promise<string|undefined>} Hex-encoded hash or undefined if no data
 */
async function oneWayEncrypt(data, sha = true) {
  if (!data) return undefined;
  
  try {
    const algorithm = sha ? 'SHA-256' : 'MD5';
    const hash = await hashData(data, algorithm);
    return hash;
  } catch (error) {
    console.error('One-way encryption error:', error.message);
    return undefined;
  }
}

/**
 * Compare plaintext with a hashed value
 * @param {string} cypher - Hashed value to compare against
 * @param {string} compare - Plaintext to hash and compare
 * @param {boolean} sha - Use SHA-256 if true, MD5 if false (default: true)
 * @returns {Promise<boolean|string>} True if match, false if no match, or cypher if invalid input
 */
async function oneWayCompare(cypher, compare, sha = true) {
  if (!cypher || !compare) return cypher;
  
  try {
    const hashed = await oneWayEncrypt(compare, sha);
    return cypher === hashed;
  } catch (error) {
    console.error('One-way comparison error:', error.message);
    return false;
  }
}

/**
 * Two-way encryption using AES-GCM with PBKDF2 key derivation
 * @param {string|object} data - Data to encrypt (will be stringified if object)
 * @param {string} passphrase - Passphrase for encryption
 * @param {object} options - Optional configuration
 * @param {number} options.iterations - Custom PBKDF2 iteration count
 * @param {string} options.securityLevel - Preset security level ('maximum', 'high', 'standard', 'fast')
 * @returns {Promise<string|null>} Hex-encoded encrypted data or null on error
 * Format: [salt(32 hex)][iv(24 hex)][authTag(32 hex)][ciphertext(hex)]
 */
async function twoWayEncrypt(data, passphrase, options = {}) {
  if (!data || !passphrase) return null;

  try {
    const crypto = getCrypto();
    
    // Determine iteration count from options
    const iterations = typeof options.iterations === 'number'
      ? options.iterations
      : (options.securityLevel && SECURITY_LEVELS[options.securityLevel])
      ? SECURITY_LEVELS[options.securityLevel]
      : PBKDF2_ITERATIONS; // Default to maximum for backward compatibility
    
    // Convert data to string if needed
    const plaintext = objToString(data);
    const plaintextBuffer = stringToArrayBuffer(plaintext);
    
    // Generate random salt and IV
    const salt = generateRandomBytes(SALT_SIZE);
    const iv = generateRandomBytes(IV_SIZE);
    
    // Derive encryption key from passphrase
    const key = await deriveKey(passphrase, salt, iterations);
    
    // Encrypt using AES-GCM (includes authentication tag)
    const algorithm = {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128  // 16 bytes authentication tag
    };
    
    const encryptedBuffer = await crypto.subtle.encrypt(algorithm, key, plaintextBuffer);
    
    // Extract ciphertext and auth tag
    // In AES-GCM, the tag is appended to the ciphertext
    const encrypted = new Uint8Array(encryptedBuffer);
    const ciphertext = encrypted.slice(0, -16); // Everything except last 16 bytes
    const authTag = encrypted.slice(-16);       // Last 16 bytes
    
    // Format: salt + iv + authTag + ciphertext (all in hex)
    const saltHex = arrayBufferToHex(salt);
    const ivHex = arrayBufferToHex(iv);
    const authTagHex = arrayBufferToHex(authTag);
    const ciphertextHex = arrayBufferToHex(ciphertext);
    
    return saltHex + ivHex + authTagHex + ciphertextHex;
  } catch (error) {
    console.error('Two-way encryption error:', error.message);
    return null;
  }
}

/**
 * Two-way decryption using AES-GCM with PBKDF2 key derivation
 * @param {string} cypher - Hex-encoded encrypted data
 * @param {string} passphrase - Passphrase for decryption
 * @param {object} options - Optional configuration
 * @param {number} options.iterations - Custom PBKDF2 iteration count
 * @param {string} options.securityLevel - Preset security level ('maximum', 'high', 'standard', 'fast')
 * @returns {Promise<string|null>} Decrypted data or null on error
 */
async function twoWayDecrypt(cypher, passphrase, options = {}) {
  if (!cypher || !passphrase) return null;

  try {
    const crypto = getCrypto();
    
    // Determine iteration count from options
    const iterations = typeof options.iterations === 'number'
      ? options.iterations
      : (options.securityLevel && SECURITY_LEVELS[options.securityLevel])
      ? SECURITY_LEVELS[options.securityLevel]
      : PBKDF2_ITERATIONS; // Default to maximum for backward compatibility
    
    // Parse format: salt(32 hex) + iv(24 hex) + authTag(32 hex) + ciphertext
    const saltHex = cypher.substring(0, 32);          // 16 bytes = 32 hex chars
    const ivHex = cypher.substring(32, 56);           // 12 bytes = 24 hex chars
    const authTagHex = cypher.substring(56, 88);      // 16 bytes = 32 hex chars
    const ciphertextHex = cypher.substring(88);       // Rest is ciphertext
    
    // Convert from hex to ArrayBuffer
    const salt = hexToArrayBuffer(saltHex);
    const iv = hexToArrayBuffer(ivHex);
    const authTag = hexToArrayBuffer(authTagHex);
    const ciphertext = hexToArrayBuffer(ciphertextHex);
    
    // Derive decryption key from passphrase
    const key = await deriveKey(passphrase, new Uint8Array(salt), iterations);
    
    // Combine ciphertext + authTag for AES-GCM decryption
    const encrypted = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
    encrypted.set(new Uint8Array(ciphertext), 0);
    encrypted.set(new Uint8Array(authTag), ciphertext.byteLength);
    
    // Decrypt using AES-GCM
    const algorithm = {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128
    };
    
    const decryptedBuffer = await crypto.subtle.decrypt(algorithm, key, encrypted);
    const decrypted = arrayBufferToString(decryptedBuffer);
    
    if (!decrypted) {
      throw new Error('Decryption failed: Invalid passphrase or corrupted data.');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Two-way decryption error:', error.message);
    return null;
  }
}

// Export with both old and new names for compatibility
export {
  oneWayEncrypt,
  oneWayCompare as oneWayComparation, // Keep old typo for backward compatibility
  oneWayCompare,
  twoWayEncrypt,
  twoWayDecrypt,
  SECURITY_LEVELS
};