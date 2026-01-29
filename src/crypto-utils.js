/**
 * Web Crypto API Wrapper Utilities
 * Provides a unified interface for cryptographic operations across browser and Node.js environments
 * Part of common-encryption v3.0 modernization
 *
 * DEPENDENCY DECISION (Phase 6):
 * - crypto-js is kept as a minimal dependency ONLY for MD5 hashing
 * - Web Crypto API does NOT support MD5 (considered cryptographically weak for security)
 * - MD5 is used here for NON-SECURITY purposes: ID generation, checksums, legacy compatibility
 * - All security-critical operations (SHA-256/384/512, AES-GCM, PBKDF2) use native Web Crypto API
 * - Bundle impact: ~15KB when tree-shaken for just MD5 usage
 * - Alternative considered: Pure JS MD5 implementation (~200 lines), but crypto-js is
 *   well-tested, maintained, and minimal overhead for this single use case
 */

import CryptoJS from 'crypto-js'; // ONLY used for MD5 (non-security use case)
import { webcrypto } from 'crypto'; // Node.js Web Crypto API

/**
 * Get the appropriate Web Crypto API object for the current environment
 * @returns {Crypto} The crypto object (window.crypto in browser, require('crypto').webcrypto in Node.js)
 * @throws {Error} If Web Crypto API is not available
 */
export function getCrypto() {
  // Browser environment
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  
  // Node.js environment (18+) - use imported webcrypto
  if (webcrypto) {
    return webcrypto;
  }
  
  throw new Error('Web Crypto API not available in this environment');
}

/**
 * Generate cryptographically secure random bytes
 * @param {number} length - Number of random bytes to generate
 * @returns {Uint8Array} Array of random bytes
 * @throws {Error} If length is invalid or crypto is unavailable
 */
export function generateRandomBytes(length) {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('Length must be a positive integer');
  }
  
  const crypto = getCrypto();
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

/**
 * Convert ArrayBuffer to hexadecimal string
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Hexadecimal string representation
 */
export function arrayBufferToHex(buffer) {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hexadecimal string to ArrayBuffer
 * @param {string} hex - Hexadecimal string to convert
 * @returns {ArrayBuffer} Resulting ArrayBuffer
 * @throws {Error} If hex string is invalid
 */
export function hexToArrayBuffer(hex) {
  if (typeof hex !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove any whitespace and validate hex format
  hex = hex.replace(/\s/g, '');
  
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have an even number of characters');
  }
  
  if (!/^[0-9a-fA-F]*$/.test(hex)) {
    throw new Error('Invalid hexadecimal string');
  }
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  
  return bytes.buffer;
}

/**
 * Convert string to ArrayBuffer using UTF-8 encoding
 * @param {string} str - String to convert
 * @returns {ArrayBuffer} Resulting ArrayBuffer
 */
export function stringToArrayBuffer(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

/**
 * Convert ArrayBuffer to string using UTF-8 decoding
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Decoded string
 */
export function arrayBufferToString(buffer) {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(buffer);
}

/**
 * Derive a cryptographic key from a passphrase using PBKDF2
 * @param {string} passphrase - The passphrase to derive key from
 * @param {Uint8Array} salt - Salt value (should be 16 bytes)
 * @param {number} iterations - Number of PBKDF2 iterations (default: 600000 for v3.0)
 * @returns {Promise<CryptoKey>} Derived key suitable for AES-GCM operations
 * @throws {Error} If parameters are invalid or key derivation fails
 */
export async function deriveKey(passphrase, salt, iterations = 600000) {
  if (typeof passphrase !== 'string' || passphrase.length === 0) {
    throw new Error('Passphrase must be a non-empty string');
  }
  
  if (!(salt instanceof Uint8Array) || salt.length !== 16) {
    throw new Error('Salt must be a Uint8Array of 16 bytes');
  }
  
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error('Iterations must be a positive integer');
  }
  
  const crypto = getCrypto();
  
  // Import the passphrase as a key
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive the AES-GCM key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    passphraseKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
  
  return derivedKey;
}

/**
 * Hash data using specified algorithm
 * @param {string} data - Data to hash
 * @param {string} algorithm - Hash algorithm ('SHA-256', 'SHA-512', or 'MD5')
 * @returns {Promise<string>} Hex-encoded hash
 * @throws {Error} If algorithm is unsupported or hashing fails
 */
export async function hashData(data, algorithm = 'SHA-256') {
  if (typeof data !== 'string') {
    throw new Error('Data must be a string');
  }
  
  // MD5 is not supported by Web Crypto API, use crypto-js
  if (algorithm === 'MD5') {
    const hash = CryptoJS.MD5(data);
    return hash.toString(CryptoJS.enc.Hex);
  }
  
  // Use Web Crypto API for SHA algorithms
  const supportedAlgorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
  if (!supportedAlgorithms.includes(algorithm)) {
    throw new Error(`Unsupported algorithm: ${algorithm}. Supported: ${supportedAlgorithms.join(', ')}, MD5`);
  }
  
  const crypto = getCrypto();
  const buffer = stringToArrayBuffer(data);
  const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
  
  return arrayBufferToHex(hashBuffer);
}