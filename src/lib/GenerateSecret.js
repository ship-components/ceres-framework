
var TwoFactor = require('two-factor');
var fs = require('fs');

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

  var key = TwoFactor.generate.key({
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
