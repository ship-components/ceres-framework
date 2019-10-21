const moment = require('moment');

/**
 * Log the time it took to start
 * @param  {String} str
 * @param  {Ceres}  ceres
 */
module.exports = function logStartTime(str, ceres) {
  // Calculate how long it took to load
  ceres.loadTime = process.hrtime(ceres.startTime);
  const loadTimeMs = Math.floor((ceres.loadTime[0] * 1e9 + ceres.loadTime[1]) / 1000000);
  const loadTimes = moment.duration(loadTimeMs).asSeconds();
  // Log it
  ceres.log.internal.info(str, loadTimes, {
    duration: loadTimeMs,
  });
};
