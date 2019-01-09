/*******************************************************************************
 * Responses
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Default rest responses
 ******************************************************************************/

/**
 * HTTP Status Codes
 *
 * @type    {Object}
 */
var STATUS = {
  OK: 200,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  FORBIDDEN: 401,
  PERMISSION_DENIED: 403,
  NOT_FOUND: 404,
  ERROR: 500
};

var Responses = {
  /**
   * OK Response
   * @param     {Mixed}    data
   */
  send: function(data) {
    if (this.res.headersSent || this.res.finished) {
      this.log.warn('%s %s', this.req.method, this.req.originalUrl, new Error('Headers already sent'));
      return;
    }
    this.res.status(STATUS.OK).json(data).end();
  },

  /**
   * Nothing to send pack but we succeed
   */
  noContent: function() {
    this.res.status(STATUS.NO_CONTENT).end();
  },

  /**
   * Can't find it
   * @param     {String}    context
   */
  notFound: function(context) {
    var err = new Error('Not Found' + (typeof context === 'string' ? ': ' + context: ''));
    err.status = STATUS.NOT_FOUND;
    this.fail(err);
  },

  /**
   * User doesn't have access
   * @param     {String}    context
   */
  forbidden: function(context) {
    var err = new Error('Forbidden' + (typeof context === 'string' ? ': ' + context: ''));
    err.status = STATUS.FORBIDDEN;
    this.fail(err);
  },

  /**
   * User doesn't have access
   * @param     {String}    context
   */
  permissionDenied: function(context) {
    var err = new Error('Forbidden' + (typeof context === 'string' ? ': ' + context: ''));
    err.status = STATUS.PERMISSION_DENIED;
    this.fail(err);
  },

  /**
   * Client sent a request that we can't process for some reason
   * @param     {String}    context
   */
  badRequest: function(context) {
    var err = new Error('Bad Request' + (typeof context === 'string' ? ': ' + context: ''));
    err.status = STATUS.BAD_REQUEST;
    this.fail(err);
  },

  /**
   * There was an error!!!
   * @param     {Mixed}    err
   */
  fail: function(err) {
    // Throw and exit the call stack or promise chain
    this.next(err);
  }

};

module.exports = Responses;
