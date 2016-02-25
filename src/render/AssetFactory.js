/*******************************************************************************
 * Pipeline
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Render Workflow to hepl ensure we consistently produce the
 *               same results across each page and prints
 * @flow
 ******************************************************************************/

var fs = require('fs');
var _ = require('lodash');

/**
 * Takes an array of checksums genereated by ./bin/checksums on deploy and
 * generates paths with hashses in their name for cache busting
 *
 * @param     {Array<object>}    checksums
 * @param     {String}           env
 * @return    {Object}
 */
function assetChecksums(checksums, env) {
  return {
    /**
     * Looks up a particular asset by it's filename and returns it's path
     *
     * @param     {String}    name
     * @return    {Object}
     */
    path: function(name) {
      // Lookup
      var checksum = _.find(checksums, function(file) {
        return file.name === name;
      });
      // Which version are we using?
      var filename = name;
      // Extension for sub dir
      var ext = name.match(/.*\.(.*)$/);

      // Construct
      var path = _.isUndefined(checksum) ? '/' : '/assets/' + checksum.hash + '/';
      path += ext[1] + '/' + filename;

      return {
        checksum: checksum ? checksum.hash : void 0,
        path: path,
        name: filename
      };
    }
  };
}

module.exports = function(config) {

  function AssetFactory(assets, checksums) {
    return {
      forPayload: function() {
        return {
          js: assets.js,
          css: assets.css
        };
      }
    };
  }

  return AssetFactory;
}
