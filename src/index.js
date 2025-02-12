import * as CryptoJS from "crypto-js";
import AES from "crypto-js/aes";

const keySize = 256;
const ivSize = 128;
const iterations = 100;
const length = 32;
const ivSizeDivider = 8;
const SALT_SIZE = ivSize / ivSizeDivider;
const IV_SIZE = ivSize / ivSizeDivider;
const KEY_SIZE = keySize / length;

// HELPERS
function isObject(obj) {
  return obj && typeof obj === 'object';
}

function objToString(obj) {
  return isObject(obj) ? JSON.stringify(obj) : obj;
}

const oneWayEncryption = function(data) {
  if (data) return CryptoJS.SHA256(data).toString();
  return data;
};

const oneWayComparation = function(cypher, compare) {
  if (cypher && compare) {
    return cypher === CryptoJS.SHA256(compare).toString();
  }
  return cypher;
};

const twoWayEncryption = function(data, passphrase) {
  if (!data || !passphrase) return null;

  data = objToString(data);
  const salt = CryptoJS.lib.WordArray.random(SALT_SIZE);
  const key = CryptoJS.PBKDF2(passphrase, salt, { keySize: KEY_SIZE, iterations });
  const iv = CryptoJS.lib.WordArray.random(IV_SIZE);
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  });
  return salt.toString() + iv.toString() + encrypted.toString();
};

const twoWayDecryption = function(cypher, passphrase) {
  if (!cypher || !passphrase) return null;

  try {
    const salt = CryptoJS.enc.Hex.parse(cypher.substr(0, length));
    const iv = CryptoJS.enc.Hex.parse(cypher.substr(length, length));
    const encrypted = cypher.substring(length * 2);
    const key = CryptoJS.PBKDF2(passphrase, salt, { keySize: KEY_SIZE, iterations });
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    }).toString(CryptoJS.enc.Utf8);

    if (!decrypted) throw new Error("Decryption failed: Invalid passphrase or corrupted data.");

    if (
      decrypted.charAt(0) === '"' &&
      decrypted.charAt(decrypted.length - 1) === '"'
    ) {
      decrypted = decrypted.substr(1, decrypted.length - 2);
    }
    return decrypted
  } catch (error) {
    console.error(error.message);
    return null;
  }
};

const oneWayEncrypt = oneWayEncryption;
const oneWayCompare = oneWayComparation;
const twoWayEncrypt = twoWayEncryption;
const twoWayDecrypt = twoWayDecryption;
export { oneWayEncrypt, oneWayCompare, twoWayEncrypt, twoWayDecrypt };