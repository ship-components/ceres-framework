/**
 * Clone and Bind context to each object value
 *
 * @param     {Object}    obj
 * @param     {Mixed}    ctx
 * @return    {Object}
 */
module.exports = function bindEach(src, ctx) {
  const obj = {};
  for (const key in src) {
    if (src.hasOwnProperty(key)) {
      obj[key] = src[key].bind(ctx);
    }
  }
  return obj;
};
