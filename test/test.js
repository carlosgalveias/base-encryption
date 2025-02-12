var assert = require('assert');
var thePackage = require('../');

console.log(thePackage);

var passphrase = 'passphrase';
var data = 'this is a string <3';
var jsonData = {
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
      var validation = (thePackage.oneWayEncrypt) ? true : false;
      assert.equal(validation,true);
    });
    it('should have one way comparation', function() {
      var validation = (thePackage.oneWayCompare) ? true : false;
      assert.equal(validation,true);
    });
    it('should have two way encryption', function() {
      var validation = (thePackage.twoWayEncrypt) ? true : false;
      assert.equal(validation,true);
    });
    it('should have two way decryption', function() {
      var validation = (thePackage.twoWayDecrypt) ? true : false;
      assert.equal(validation,true);
    });
  });
});

describe('One-way encryption testing. Hash & Compare', function() {
  describe('Valid test', function() {
    var encrypted = thePackage.oneWayEncrypt(passphrase);
    var decrypted = thePackage.oneWayCompare(encrypted,passphrase);

    it('Should encrypt a variable', function() {
      assert.notEqual(passphrase,encrypted);
    });

    it('Should decrypt a variable', function() {

      assert.equal(decrypted, true);
    });
  });
});

describe('Two-way encryption testing. Encrypt & Decrypt', function() {

  describe('Valid test with string', function() {

    var encrypted = thePackage.twoWayEncrypt(data, passphrase);
    var decrypted = thePackage.twoWayDecrypt(encrypted, passphrase);

    it('Should encrypt a string', function() {
      assert.notEqual(passphrase,encrypted);
    });

    it('Should decrypt a string', function() {
      assert.equal(data, decrypted);
    });

    it('Should encrypt a json stringified object', function(){
      var encrypted = thePackage.twoWayEncrypt(JSON.stringify(jsonData), passphrase);
      assert.notEqual(passphrase,encrypted);
    });
    it('Should decrypt a json stringified object', function() {
      var data = JSON.stringify(jsonData);
      var encrypted = thePackage.twoWayEncrypt(data, passphrase);
      var decrypted = thePackage.twoWayDecrypt(encrypted, passphrase);
      assert.equal(data, decrypted);
    });

  });

  describe('Valid test with object', function() {
    var data = jsonData;
    var encrypted = thePackage.twoWayEncrypt(data, passphrase);
    var decrypted = thePackage.twoWayDecrypt(encrypted, passphrase);

    it('Should encrypt jsonData', function() {
      assert.notEqual(passphrase,encrypted);
    });

    it('Should decrypt jsonData', function() {
      var data = jsonData;
      var encrypted = thePackage.twoWayEncrypt(data, passphrase);
      var decrypted = thePackage.twoWayDecrypt(encrypted, passphrase);
      assert.equal(JSON.stringify(data), decrypted);
    });

    var data = [1,2,"xxx"];
    var encrypted = thePackage.twoWayEncrypt(data, passphrase);
    var decrypted = thePackage.twoWayDecrypt(encrypted, passphrase);

    it('Should encrypt a array', function() {
      assert.notEqual(passphrase,encrypted);
    });

    it('Should decrypt a array', function() {
      var data = [1,2,"xxx"];
      var encrypted = thePackage.twoWayEncrypt(data, passphrase);
      var decrypted = thePackage.twoWayDecrypt(encrypted, passphrase);
      assert.equal(JSON.stringify(data), decrypted);
    });

    var data = [];
    var encrypted = thePackage.twoWayEncrypt(data, passphrase);
    var decrypted = thePackage.twoWayDecrypt(encrypted, passphrase);

    it('Should encrypt a empty array', function() {
      assert.notEqual(passphrase,encrypted);
    });

    it('Should decrypt a empty array', function() {
      var data = [];
      var encrypted = thePackage.twoWayEncrypt(data, passphrase);
      var decrypted = thePackage.twoWayDecrypt(encrypted, passphrase);
      assert.equal(JSON.stringify(data), decrypted);
    });

    it('Should encrypt a false positive', function() {
      assert.notEqual(passphrase,encrypted);
    });

    it('Should decrypt a false positive', function() {
      var data = null;
      var encrypted = thePackage.twoWayEncrypt(data, passphrase);
      var decrypted = thePackage.twoWayDecrypt(encrypted, passphrase);
      assert.equal(data, decrypted);
    });
  });
});
