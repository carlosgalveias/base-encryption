# Common Encryption Utility

A JavaScript module for one-way and two-way encryption using `crypto-js`. Supports hashing with SHA-256 and AES encryption/decryption.
Supports both browser as well as node.

## Notes
When encrypting it will aways assume the encryption of text, if the input is a object its going to be stringified but whe decryting it will allways return text.

## Features
- **One-way encryption**: Hash data using SHA-256.
- **One-way comparison**: Compare hashed data.
- **Two-way encryption**: Encrypt data using AES with a passphrase.
- **Two-way decryption**: Decrypt AES-encrypted data.

## Installation

```sh
npm install base-encryption
```

## Usage

### Importing the Module

```js
import commonEncryption from 'common-encryption';
```

### One-Way Encryption (SHA-256 Hashing)

```js
const sha = true;
const hash = commonEncryption.oneWayEncrypt("mySecretData", sha);
console.log(hash); // Output: SHA-256 hash of "mySecretData" if sha is true or MD5 if false
```

### One-Way Comparison

```js
const isMatch = commonEncryption.oneWayCompare(hash, "mySecretData", sha);
console.log(isMatch); // Output: true or false
```

### Two-Way Encryption (AES)

```js
const passphrase = "mySecurePassphrase";
const encryptedData = commonEncryption.twoWayEncrypt("Sensitive Data", passphrase);
console.log(encryptedData); // Output: AES encrypted string
```

### Two-Way Decryption

```js
const decryptedData = commonEncryption.twoWayDecrypt(encryptedData, passphrase);
console.log(decryptedData); // Output: "Sensitive Data"
```

## Technical Details
- Uses **AES-256-CBC** for two-way encryption.
- Salt and IV are randomly generated.
- **PBKDF2** is used for key derivation with 100 iterations.

## License
Apache

