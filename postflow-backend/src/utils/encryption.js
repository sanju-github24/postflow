const CryptoJS = require('crypto-js');
const KEY = process.env.ENCRYPTION_KEY || 'fallback_key_32chars_changeme!!';

const encrypt = (text) => {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text, KEY).toString();
};

const decrypt = (ciphertext) => {
  if (!ciphertext) return null;
  return CryptoJS.AES.decrypt(ciphertext, KEY).toString(CryptoJS.enc.Utf8);
};

module.exports = { encrypt, decrypt };
