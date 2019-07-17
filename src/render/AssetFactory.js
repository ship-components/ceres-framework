/** *****************************************************************************
 * Pipeline
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Render Workflow to hepl ensure we consistently produce the
 *               same results across each page and prints
 * @flow
 ***************************************************************************** */

module.exports = function() {
  function AssetFactory(assets) {
    return {
      forPayload() {
        return {
          js: assets.js,
          css: assets.css,
        };
      },
    };
  }

  return AssetFactory;
};
