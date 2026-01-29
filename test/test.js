import assert from 'assert';
import {
  oneWayEncrypt,
  oneWayCompare,
  twoWayEncrypt,
  twoWayDecrypt
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
      const encrypted = await twoWayEncrypt(data, password);
      assert.notEqual(data, encrypted);
      assert.ok(encrypted);
    });

    it('Should decrypt a string', async function() {
      const encrypted = await twoWayEncrypt(data, password);
      const decrypted = await twoWayDecrypt(encrypted, password);
      assert.equal(data, decrypted);
    });

    it('Should encrypt a json stringified object', async function() {
      const encrypted = await twoWayEncrypt(JSON.stringify(jsonData), password);
      assert.notEqual(JSON.stringify(jsonData), encrypted);
      assert.ok(encrypted);
    });

    it('Should decrypt a json stringified object', async function() {
      const stringified = JSON.stringify(jsonData);
      const encrypted = await twoWayEncrypt(stringified, password);
      const decrypted = await twoWayDecrypt(encrypted, password);
      assert.equal(stringified, decrypted);
    });
  });

  describe('Valid test with object', function() {
    it('Should encrypt jsonData', async function() {
      const encrypted = await twoWayEncrypt(jsonData, password);
      assert.notEqual(JSON.stringify(jsonData), encrypted);
      assert.ok(encrypted);
    });

    it('Should decrypt jsonData', async function() {
      const encrypted = await twoWayEncrypt(jsonData, password);
      const decrypted = await twoWayDecrypt(encrypted, password);
      const parsed = JSON.parse(decrypted);
      assert.deepEqual(parsed, jsonData);
    });
  });

  describe('Valid test with array', function() {
    it('Should encrypt an array', async function() {
      const arrayData = [1, 2, "xxx"];
      const encrypted = await twoWayEncrypt(arrayData, password);
      assert.notEqual(JSON.stringify(arrayData), encrypted);
      assert.ok(encrypted);
    });

    it('Should decrypt an array', async function() {
      const arrayData = [1, 2, "xxx"];
      const encrypted = await twoWayEncrypt(arrayData, password);
      const decrypted = await twoWayDecrypt(encrypted, password);
      const parsed = JSON.parse(decrypted);
      assert.deepEqual(parsed, arrayData);
    });

    it('Should encrypt an empty array', async function() {
      const emptyArray = [];
      const encrypted = await twoWayEncrypt(emptyArray, password);
      assert.ok(encrypted);
    });

    it('Should decrypt an empty array', async function() {
      const emptyArray = [];
      const encrypted = await twoWayEncrypt(emptyArray, password);
      const decrypted = await twoWayDecrypt(encrypted, password);
      const parsed = JSON.parse(decrypted);
      assert.deepEqual(parsed, emptyArray);
    });
  });

  describe('Valid test with null', function() {
    it('Should return null when encrypting null value', async function() {
      const encrypted = await twoWayEncrypt(null, password);
      assert.equal(encrypted, null);
    });

    it('Should return null when decrypting null', async function() {
      const decrypted = await twoWayDecrypt(null, password);
      assert.equal(decrypted, null);
    });
  });
});

describe('v3.0 Security Features', function() {
  it('Should produce different ciphertexts for same input', async function() {
    const enc1 = await twoWayEncrypt('test', password);
    const enc2 = await twoWayEncrypt('test', password);
    assert.notEqual(enc1, enc2); // Due to random IV
  });

  it('Should return null for wrong password', async function() {
    const encrypted = await twoWayEncrypt('test', password);
    const decrypted = await twoWayDecrypt(encrypted, 'wrongpassword');
    assert.equal(decrypted, null);
  });

  it('Should return null for corrupted ciphertext', async function() {
    const encrypted = await twoWayEncrypt('test', password);
    // Corrupt the ciphertext by changing a character
    const corrupted = encrypted.substring(0, 10) + 'X' + encrypted.substring(11);
    const decrypted = await twoWayDecrypt(corrupted, password);
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
