/**
 * Clone and Bind context to each object value
 *
 * @param     {Object}  src
 * @param     {any}    ctx
 * @return    {Object}
 */
module.exports = function bindEach(src, ctx) {
  const obj = {};
  Object.keys(src).forEach(key => {
    obj[key] = src[key].bind(ctx);
  });
  return obj;
};
