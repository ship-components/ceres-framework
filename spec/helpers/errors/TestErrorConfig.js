/**
 * Mock config for testing errors
 * @type    {Object}
 */
module.exports = () => {
  return {
    key: require('fs').readFileSync('does-not-exist'),
  };
};
