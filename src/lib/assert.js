/**
 * Ensure a value is not null or throw an erroe
 * @param    {Mixed}    val
 * @return   {Undefined}
 */
module.exports.assertNotNull = function assertNotNull(val) {
  if (val === null) {
    throw new TypeError('Model is null');
  }
};

/**
 * Ensure a value is defined
 * @param    {Mixed}    val
 * @return   {Undefined}
 */
module.exports.assertDefined = function assertDefined(val, name) {
  if (typeof val === 'undefined') {
    throw new TypeError(`${typeof name === 'string' ? name : 'value'} is undefined`);
  }
};
