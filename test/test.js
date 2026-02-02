import assert from 'assert';
import {
  oneWayEncrypt,
  oneWayCompare,
  twoWayEncrypt,
  twoWayDecrypt,
  SECURITY_LEVELS
} from '../src/index.js';

// Test data
const passphrase = 'passphrase';
const password = 'password';
const data = 'this is a string <3';
const jsonData = {
  name: "pihh",
  speciality: "beer",
  array: [1,2,3],
  arrayObj: [
    {
      name: "test"
    }
  ]
};

describe('Load the package for testing', function() {
  describe('Has it load?', function() {
    it('should have one way encryption', function() {
      const validation = (oneWayEncrypt) ? true : false;
      assert.equal(validation, true);
    });
    it('should have one way comparation', function() {
      const validation = (oneWayCompare) ? true : false;
      assert.equal(validation, true);
    });
    it('should have two way encryption', function() {
      const validation = (twoWayEncrypt) ? true : false;
      assert.equal(validation, true);
    });
    it('should have two way decryption', function() {
      const validation = (twoWayDecrypt) ? true : false;
      assert.equal(validation, true);
    });
  });
});

describe('One-way encryption testing. Hash & Compare', function() {
  describe('Valid test', function() {
    it('Should encrypt a variable', async function() {
      const encrypted = await oneWayEncrypt(passphrase);
      assert.notEqual(passphrase, encrypted);
      assert.ok(encrypted);
    });

    it('Should compare hashes correctly', async function() {
      const encrypted = await oneWayEncrypt(passphrase);
      const result = await oneWayCompare(encrypted, passphrase);
      assert.equal(result, true);
    });

    it('Should fail comparison with wrong passphrase', async function() {
      const encrypted = await oneWayEncrypt(passphrase);
      const result = await oneWayCompare(encrypted, 'wrongpassphrase');
      assert.equal(result, false);
    });
  });
});

describe('Two-way encryption testing. Encrypt & Decrypt', function() {
  describe('Valid test with string', function() {
    it('Should encrypt a string', async function() {
      const encrypted = await twoWayEncrypt(data, password, {securityLevel: 'fast'});
      assert.notEqual(data, encrypted);
      assert.ok(encrypted);
    });

    it('Should decrypt a string', async function() {
      const encrypted = await twoWayEncrypt(data, password, {securityLevel: 'fast'});
      const decrypted = await twoWayDecrypt(encrypted, password, {securityLevel: 'fast'});
      assert.equal(data, decrypted);
    });

    it('Should encrypt a json stringified object', async function() {
      const encrypted = await twoWayEncrypt(JSON.stringify(jsonData), password, {securityLevel: 'fast'});
      assert.notEqual(JSON.stringify(jsonData), encrypted, {securityLevel: 'fast'});
      assert.ok(encrypted);
    });

    it('Should decrypt a json stringified object', async function() {
      const stringified = JSON.stringify(jsonData);
      const encrypted = await twoWayEncrypt(stringified, password, {securityLevel: 'fast'});
      const decrypted = await twoWayDecrypt(encrypted, password, {securityLevel: 'fast'});
      assert.equal(stringified, decrypted);
    });
  });

  describe('Valid test with object', function() {
    it('Should encrypt jsonData', async function() {
      const encrypted = await twoWayEncrypt(jsonData, password, {securityLevel: 'fast'});
      assert.notEqual(JSON.stringify(jsonData), encrypted, {securityLevel: 'fast'});
      assert.ok(encrypted);
    });

    it('Should decrypt jsonData', async function() {
      const encrypted = await twoWayEncrypt(jsonData, password, {securityLevel: 'fast'});
      const decrypted = await twoWayDecrypt(encrypted, password, {securityLevel: 'fast'});
      const parsed = JSON.parse(decrypted);
      assert.deepEqual(parsed, jsonData);
    });
  });

  describe('Valid test with array', function() {
    it('Should encrypt an array', async function() {
      const arrayData = [1, 2, "xxx"];
      const encrypted = await twoWayEncrypt(arrayData, password, {securityLevel: 'fast'});
      assert.notEqual(JSON.stringify(arrayData), encrypted, {securityLevel: 'fast'});
      assert.ok(encrypted);
    });

    it('Should decrypt an array', async function() {
      const arrayData = [1, 2, "xxx"];
      const encrypted = await twoWayEncrypt(arrayData, password, {securityLevel: 'fast'});
      const decrypted = await twoWayDecrypt(encrypted, password, {securityLevel: 'fast'});
      const parsed = JSON.parse(decrypted);
      assert.deepEqual(parsed, arrayData);
    });

    it('Should encrypt an empty array', async function() {
      const emptyArray = [];
      const encrypted = await twoWayEncrypt(emptyArray, password, {securityLevel: 'fast'});
      assert.ok(encrypted);
    });

    it('Should decrypt an empty array', async function() {
      const emptyArray = [];
      const encrypted = await twoWayEncrypt(emptyArray, password, {securityLevel: 'fast'});
      const decrypted = await twoWayDecrypt(encrypted, password, {securityLevel: 'fast'});
      const parsed = JSON.parse(decrypted);
      assert.deepEqual(parsed, emptyArray);
    });
  });

  describe('Valid test with null', function() {
    it('Should return null when encrypting null value', async function() {
      const encrypted = await twoWayEncrypt(null, password, {securityLevel: 'fast'});
      assert.equal(encrypted, null);
    });

    it('Should return null when decrypting null', async function() {
      const decrypted = await twoWayDecrypt(null, password, {securityLevel: 'fast'});
      assert.equal(decrypted, null);
    });
  });
});

describe('v3.0 Security Features', function() {
  it('Should produce different ciphertexts for same input', async function() {
    const enc1 = await twoWayEncrypt('test', password, {securityLevel: 'fast'});
    const enc2 = await twoWayEncrypt('test', password, {securityLevel: 'fast'});
    assert.notEqual(enc1, enc2); // Due to random IV
  });

  it('Should return null for wrong password', async function() {
    const encrypted = await twoWayEncrypt('test', password, {securityLevel: 'fast'});
    const decrypted = await twoWayDecrypt(encrypted, 'wrongpassword');
    assert.equal(decrypted, null);
  });

  it('Should return null for corrupted ciphertext', async function() {
    const encrypted = await twoWayEncrypt('test', password, {securityLevel: 'fast'});
    // Corrupt the ciphertext by changing a character
    const corrupted = encrypted.substring(0, 10) + 'X' + encrypted.substring(11);
    const decrypted = await twoWayDecrypt(corrupted, password, {securityLevel: 'fast'});
    assert.equal(decrypted, null);
  });

  it('Should support explicit SHA-256 hashing', async function() {
    const hash = await oneWayEncrypt('test', true);
    assert.ok(hash);
    assert.equal(hash.length, 64); // SHA-256 hex length
  });

  it('Should support MD5 for IDs', async function() {
    const hash = await oneWayEncrypt('test', false);
    assert.ok(hash);
    assert.equal(hash.length, 32); // MD5 hex length
  });

  it('Should use SHA-256 by default for one-way encryption', async function() {
    const hash = await oneWayEncrypt('test');
    assert.ok(hash);
    assert.equal(hash.length, 64); // SHA-256 hex length
  });
});

describe('Security Level Options', function() {
  describe('Predefined security levels', function() {
    it('should encrypt and decrypt with fast security level', async function() {
      const encrypted = await twoWayEncrypt(data, password, { securityLevel: 'fast' });
      assert.ok(encrypted);
      assert.notEqual(data, encrypted);
      
      const decrypted = await twoWayDecrypt(encrypted, password, { securityLevel: 'fast' });
      assert.equal(decrypted, data);
    });

    it('should encrypt and decrypt with standard security level', async function() {
      const encrypted = await twoWayEncrypt(data, password, { securityLevel: 'standard' });
      assert.ok(encrypted);
      assert.notEqual(data, encrypted);
      
      const decrypted = await twoWayDecrypt(encrypted, password, { securityLevel: 'standard' });
      assert.equal(decrypted, data);
    });

    it('should encrypt and decrypt with high security level', async function() {
      const encrypted = await twoWayEncrypt(data, password, { securityLevel: 'high' });
      assert.ok(encrypted);
      assert.notEqual(data, encrypted);
      
      const decrypted = await twoWayDecrypt(encrypted, password, { securityLevel: 'high' });
      assert.equal(decrypted, data);
    });

    it('should encrypt and decrypt with maximum security level', async function() {
      const encrypted = await twoWayEncrypt(data, password, { securityLevel: 'maximum' });
      assert.ok(encrypted);
      assert.notEqual(data, encrypted);
      
      const decrypted = await twoWayDecrypt(encrypted, password, { securityLevel: 'maximum' });
      assert.equal(decrypted, data);
    });
  });

  describe('Custom iteration counts', function() {
    it('should encrypt and decrypt with custom 5000 iterations', async function() {
      const encrypted = await twoWayEncrypt(data, password, { iterations: 5000 });
      assert.ok(encrypted);
      assert.notEqual(data, encrypted);
      
      const decrypted = await twoWayDecrypt(encrypted, password, { iterations: 5000 });
      assert.equal(decrypted, data);
    });

    it('should encrypt and decrypt with custom 1000 iterations', async function() {
      const encrypted = await twoWayEncrypt(data, password, { iterations: 1000 });
      assert.ok(encrypted);
      assert.notEqual(data, encrypted);
      
      const decrypted = await twoWayDecrypt(encrypted, password, { iterations: 1000 });
      assert.equal(decrypted, data);
    });

    it('should encrypt and decrypt JSON data with custom iterations', async function() {
      const encrypted = await twoWayEncrypt(jsonData, password, { iterations: 5000 });
      assert.ok(encrypted);
      
      const decrypted = await twoWayDecrypt(encrypted, password, { iterations: 5000 });
      const parsed = JSON.parse(decrypted);
      assert.deepEqual(parsed, jsonData);
    });
  });

  describe('Backward compatibility', function() {
    it('should decrypt data encrypted with default options (no options provided)', async function() {
      const encrypted = await twoWayEncrypt(data, password);
      const decrypted = await twoWayDecrypt(encrypted, password);
      assert.equal(decrypted, data);
    });

    it('should maintain consistent encryption/decryption with matching security levels', async function() {
      const testData = 'test data for consistency check';
      
      // Encrypt with fast level
      const fastEncrypted = await twoWayEncrypt(testData, password, { securityLevel: 'fast' });
      const fastDecrypted = await twoWayDecrypt(fastEncrypted, password, { securityLevel: 'fast' });
      assert.equal(fastDecrypted, testData);
      
      // Encrypt with standard level
      const standardEncrypted = await twoWayEncrypt(testData, password, { securityLevel: 'standard' });
      const standardDecrypted = await twoWayDecrypt(standardEncrypted, password, { securityLevel: 'standard' });
      assert.equal(standardDecrypted, testData);
    });

    it('should handle mixed iteration and security level options', async function() {
      // Custom iterations should override security level
      const encrypted = await twoWayEncrypt(data, password, {
        securityLevel: 'fast',
        iterations: 5000
      });
      const decrypted = await twoWayDecrypt(encrypted, password, { iterations: 5000 });
      assert.equal(decrypted, data);
    });
  });

  describe('SECURITY_LEVELS export', function() {
    it('should export SECURITY_LEVELS constant', function() {
      assert.ok(SECURITY_LEVELS);
      assert.equal(typeof SECURITY_LEVELS, 'object');
    });

    it('should have all expected security level keys', function() {
      assert.ok(SECURITY_LEVELS.fast);
      assert.ok(SECURITY_LEVELS.standard);
      assert.ok(SECURITY_LEVELS.high);
      assert.ok(SECURITY_LEVELS.maximum);
    });

    it('should have correct iteration values for each level', function() {
      assert.equal(SECURITY_LEVELS.fast, 1000);
      assert.equal(SECURITY_LEVELS.standard, 10000);
      assert.equal(SECURITY_LEVELS.high, 100000);
      assert.equal(SECURITY_LEVELS.maximum, 600000);
    });
  });

  describe('Edge cases and error handling', function() {
    it('should handle null values with security level options', async function() {
      const encrypted = await twoWayEncrypt(null, password, { securityLevel: 'fast' });
      assert.equal(encrypted, null);
      
      const decrypted = await twoWayDecrypt(null, password, { securityLevel: 'fast' });
      assert.equal(decrypted, null);
    });

    it('should fail decryption with wrong security level', async function() {
      const encrypted = await twoWayEncrypt(data, password, { securityLevel: 'fast' });
      const decrypted = await twoWayDecrypt(encrypted, password, { securityLevel: 'maximum' });
      // This should fail because the iteration count doesn't match
      assert.equal(decrypted, null);
    });

    it('should produce different ciphertexts with different security levels', async function() {
      const fastEnc = await twoWayEncrypt(data, password, { securityLevel: 'fast' });
      const maxEnc = await twoWayEncrypt(data, password, { securityLevel: 'maximum' });
      
      assert.notEqual(fastEnc, maxEnc);
    });
  });
});
