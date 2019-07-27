/**
 * HTTP Status Codes
 * @enum {number}
 */
const STATUS = {
  OK: 200,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  FORBIDDEN: 401,
  PERMISSION_DENIED: 403,
  NOT_FOUND: 404,
  ERROR: 500,
};

const Responses = {
  /**
   * OK Response
   * @param     {Mixed}    data
   */
  send(data) {
    if (this.res.headersSent || this.res.finished) {
      this.log.warn(
        '%s %s',
        this.req.method,
        this.req.originalUrl,
        new Error('Headers already sent')
      );
      return;
    }
    this.res
      .status(STATUS.OK)
      .json(data)
      .end();
  },

  /**
   * Nothing to send pack but we succeed
   */
  noContent() {
    this.res.status(STATUS.NO_CONTENT).end();
  },

  /**
   * Can't find it
   * @param     {String}    context
   */
  notFound(context) {
    const err = new Error(`Not Found${typeof context === 'string' ? `: ${context}` : ''}`);
    err.status = STATUS.NOT_FOUND;
    this.fail(err);
  },

  /**
   * User doesn't have access
   * @param     {String}    context
   */
  forbidden(context) {
    const err = new Error(`Forbidden${typeof context === 'string' ? `: ${context}` : ''}`);
    err.status = STATUS.FORBIDDEN;
    this.fail(err);
  },

  /**
   * User doesn't have access
   * @param     {String}    context
   */
  permissionDenied(context) {
    const err = new Error(`Forbidden${typeof context === 'string' ? `: ${context}` : ''}`);
    err.status = STATUS.PERMISSION_DENIED;
    this.fail(err);
  },

  /**
   * Client sent a request that we can't process for some reason
   * @param     {String}    context
   */
  badRequest(context) {
    const err = new Error(`Bad Request${typeof context === 'string' ? `: ${context}` : ''}`);
    err.status = STATUS.BAD_REQUEST;
    this.fail(err);
  },

  /**
   * There was an error!!!
   * @param     {Mixed}    err
   */
  fail(err) {
    // Throw and exit the call stack or promise chain
    this.next(err);
  },
};

module.exports = Responses;
