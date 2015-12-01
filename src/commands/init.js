/*******************************************************************************
 * init
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Generate a secret key for the application
 ******************************************************************************/

var TwoFactor = require('two-factor');
var fs = require('fs');
var _ = require('lodash');

/**
 * Generates a random key andsaves to disk. Used to store secrets
 *
 * @param     {String}    filename
 */
function generateSecretKey(options) {
  options = _.extend({
    rc: '.apprc',
    length: 64
  }, options);

  var key = TwoFactor.generate.key({
    symbols: true,
    type: 'ascii',
    length: options.length
  });

  // Chaining for semantics
  return {
    thenSave: function() {
      var rc = {};

      // If the file already exists read it so we don't lose anything
      if (fs.existsSync(options.rc)) {
        try {
          rc = JSON.parse(fs.readFileSync(options.rc));
        } catch (err) {
          console.error(err);
        }
      }

      rc.secret = key;

      fs.writeFileSync(options.rc, JSON.stringify(rc, null, 4));
      console.log('Key successfully generated and saved to %s', options.rc);
    }
  };
}

module.exports.generateSecretKey = generateSecretKey;

module.exports = function init(options) {
  generateSecretKey(options).thenSave();
};
