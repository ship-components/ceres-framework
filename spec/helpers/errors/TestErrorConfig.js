/**
 * Mock config for testing errors
 * @type    {Object}
 */
module.exports = function(){
  return {
    key: require('fs').readFileSync('does-not-exist')
  };
};
