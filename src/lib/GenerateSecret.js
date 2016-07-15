var fs = require('fs');

/**
 * Creates a random string
 *
 * @param     {Object}    options
 * @return    {String}
 */
function randomString(options) {
  var set = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';

  if (options.symbols === true) {
    set += '!@#$%^&*()<>?/[]{},.:;';
  }

  var key = '';
  for (var i = 0; i < options.length; i++) {
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
  options = _.extend({
    length: 32,
    name: '',
    symbols: false,
    google: false,
    qrCode: false,
    type: 'base32'
  }, options || {});

  // Generate the random string
  var key = randomString(options);

  if (options.type === 'ascii') {
    return key;
  } else if (options.type === 'base32') {
    // Encode the ascii string into base32 and remove any `=` signs which google
    // doesn't like
    key = base32.encode(key).toString().replace(/=/g, '');

    return key;
  } else {
    throw new Error('InvalidKeyType');
  }
}

/**
 * Generates a random key andsaves to disk. Used to store secrets
 *
 * @param     {String}    filename
 */
module.exports = function GenerateSecretKey(pkg, overrides) {
  overrides = overrides || {};

  var options = {
    rc: '.' + pkg.name + 'rc',
    length: 64
  };

  for (var key in overrides) {
    if (overrides.hasOwnProperty(key) && overrides[key]) {
      options[key] = overrides[key];
    }
  }

  var key = generateKey({
    symbols: true,
    type: 'ascii',
    length: options.length
  });

  // Chaining for semantics
  return {
    save: function(callback) {
      callback = callback || function() {}
      try {
        var rc = {};

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
    }
  };
}
