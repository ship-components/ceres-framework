const { findCommonError } = require('../../src/lib/findCommonError');

describe('findCommonError', () => {
  it('should export a function', () => {
    expect(typeof findCommonError).toBe('function');
  });

  it('should return a status of 404 when Not Found is the prefix', () => {
    ['NotFound', 'Not Found: Unable to find record', 'NotFound: Unable to find record'].forEach(
      message => {
        const err = new Error(message);
        const result = findCommonError(err);
        expect(result).toBeDefined();
        expect(result.status).toBe(404);
      }
    );
  });

  it('should return a status of 403 when Permission Denied is the prefix', () => {
    [
      'Permission Denied',
      'PermissionDenied',
      'PermissionDenied: You are not allowed to see this',
    ].forEach(message => {
      const err = new Error(message);
      const result = findCommonError(err);
      expect(result).toBeDefined();
      expect(result.status).toBe(403);
    });
  });

  it('should return a status of 403 when Permission Denied is the prefix', () => {
    ['Forbidden', 'Forbidden: You do not have permission'].forEach(message => {
      const err = new Error(message);
      const result = findCommonError(err);
      expect(result).toBeDefined();
      expect(result.status).toBe(401);
    });
  });

  it('should return a status of 400 when Bad Request is the prefix', () => {
    ['Bad Request', 'BadRequest', 'Bad Request: Invalid input'].forEach(message => {
      const err = new Error(message);
      const result = findCommonError(err);
      expect(result).toBeDefined();
      expect(result.status).toBe(400);
    });
  });

  it('should return a status of 400 when code is EBADCSRFTOKEN', () => {
    const err = new Error('Bad Token');
    err.code = 'EBADCSRFTOKEN';
    const result = findCommonError(err);
    expect(result).toBeDefined();
    expect(result.status).toBe(400);
  });

  it('should return a status of the default message if we see a matching status', () => {
    const err = new Error('Lost');
    err.status = 404;
    const result = findCommonError(err);
    expect(result).toBeDefined();
    expect(result.status).toBe(404);
    expect(result.message).toBe('Unable to find resource');
  });

  it('should log silly if the error is matched by regex', () => {
    const err = new Error('Not Found');
    const logger = {
      silly: jest.fn(),
    };
    findCommonError(err, logger);
    expect(logger.silly).toHaveBeenCalledTimes(1);
  });

  it('should log silly if the error is matched by value', () => {
    const logger = {
      silly: jest.fn(),
    };
    const err = new Error('Lost');
    err.status = 404;
    findCommonError(err, logger);
    expect(logger.silly).toHaveBeenCalledTimes(1);
  });
});
