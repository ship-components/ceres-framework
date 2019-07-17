const fs = require('fs');
const base32 = require('base32');

/**
 * Creates a random string
 *
 * @param     {Object}    options
 * @return    {String}
 */
function randomString(options) {
  let set = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';

  if (options.symbols === true) {
    set += '!@#$%^&*()<>?/[]{},.:;';
  }

  let key = '';
  for (let i = 0; i < options.length; i++) {
    key += set.charAt(Math.floor(Math.random() * set.length));
  }

  return key;
}

/**
 * Generates a random base32 secret key and optionally a qrcode
 *
 * @param     {Object}    options
 * @return    {Object}
 */
function generateKey(options) {
  // Options
  options = Object.assign(
    {
      length: 32,
      name: '',
      symbols: false,
      google: false,
      qrCode: false,
      type: 'base32',
    },
    options || {}
  );

  // Generate the random string
  let key = randomString(options);

  if (options.type === 'ascii') {
    return key;
  }
  if (options.type === 'base32') {
    // Encode the ascii string into base32 and remove any `=` signs which google
    // doesn't like
    key = base32
      .encode(key)
      .toString()
      .replace(/\=/g, '');

    return key;
  }
  throw new Error('InvalidKeyType');
}

/**
 * Generates a random key andsaves to disk. Used to store secrets
 *
 * @param     {String}    filename
 */
module.exports = function GenerateSecretKey(pkg, overrides) {
  overrides = overrides || {};

  const options = {
    rc: `.${pkg.name}rc`,
    length: 64,
  };

  for (const prop in overrides) {
    if (overrides.hasOwnProperty(prop) && overrides[prop]) {
      options[prop] = overrides[prop];
    }
  }

  const key = generateKey({
    symbols: true,
    type: 'ascii',
    length: options.length,
  });

  // Chaining for semantics
  return {
    save(callback) {
      callback = callback || function() {};
      try {
        let rc = {};

        // If the file already exists read it so we don't lose anything
        if (fs.existsSync(options.rc)) {
          rc = JSON.parse(fs.readFileSync(options.rc));
        }

        rc.secret = key;

        fs.writeFileSync(options.rc, JSON.stringify(rc, null, 4));

        callback(null, options);
      } catch (e) {
        callback(e);
      }
    },
  };
};
