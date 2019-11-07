const Responses = require('../../src/controllers/Responses');

describe('Responses', () => {
  it('should export an object', () => {
    expect(typeof Responses).toBe('object');
    expect(Responses).toBeTruthy();
  });

  describe('send', () => {
    it('return a standard 200 json response', () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      res.end = jest.fn().mockReturnValue(res);
      res.headersSent = false;
      res.finished = false;
      const ctx = {
        res,
      };
      const data = { test: true };
      Responses.send.call(ctx, data);
      expect(ctx.res.status).toHaveBeenCalledWith(200);
      expect(ctx.res.json).toHaveBeenCalledWith(data);
      expect(ctx.res.end).toHaveBeenCalledWith();
    });

    it('should warn if the headers have already been sent', () => {
      const ctx = {
        log: {
          warn: jest.fn(),
        },
        res: {
          headersSent: true,
        },
        req: {
          method: 'GET',
          originalUrl: '',
        },
      };
      const data = { test: true };
      Responses.send.call(ctx, data);
      expect(ctx.log.warn).toHaveBeenCalled();
    });
  });

  describe('errors', () => {
    it('should call fail with a default message', () => {
      ['notFound', 'forbidden', 'permissionDenied', 'badRequest'].forEach(key => {
        const ctx = {
          fail: jest.fn(),
        };
        Responses[key].call(ctx);
        expect(ctx.fail).toHaveBeenCalled();
      });
    });

    describe('noContent', () => {
      it('return a standard 204 json response', () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.end = jest.fn().mockReturnValue(res);
        res.headersSent = false;
        res.finished = false;
        const ctx = {
          res,
        };
        Responses.noContent.call(ctx);
        expect(ctx.res.status).toHaveBeenCalledWith(204);
        expect(ctx.res.end).toHaveBeenCalledWith();
      });
    });

    describe('notFound', () => {
      it('should call fail with a Not Found Error', () => {
        const ctx = {
          fail: jest.fn(),
        };
        const message = 'No Record';
        Responses.notFound.call(ctx, message);
        expect(ctx.fail).toHaveBeenCalled();
        expect(ctx.fail.mock.calls[0][0].message.indexOf(message)).toBeGreaterThan(-1);
        expect(ctx.fail.mock.calls[0][0].status).toBe(404);
      });
    });

    describe('forbidden', () => {
      it('should call fail with a Forbidden Error', () => {
        const ctx = {
          fail: jest.fn(),
        };
        const message = 'No Auth';
        Responses.forbidden.call(ctx, message);
        expect(ctx.fail).toHaveBeenCalled();
        expect(ctx.fail.mock.calls[0][0].message.indexOf(message)).toBeGreaterThan(-1);
        expect(ctx.fail.mock.calls[0][0].status).toBe(401);
      });
    });

    describe('permissionDenied', () => {
      it('should call fail with a Permission Dendied Error', () => {
        const ctx = {
          fail: jest.fn(),
        };
        const message = 'You do not have access';
        Responses.permissionDenied.call(ctx, message);
        expect(ctx.fail).toHaveBeenCalled();
        expect(ctx.fail.mock.calls[0][0].message.indexOf(message)).toBeGreaterThan(-1);
        expect(ctx.fail.mock.calls[0][0].status).toBe(403);
      });
    });

    describe('badRequest', () => {
      it('should call fail with a Bad Request Error', () => {
        const ctx = {
          fail: jest.fn(),
        };
        const message = 'Invalid Input';
        Responses.badRequest.call(ctx, message);
        expect(ctx.fail).toHaveBeenCalled();
        expect(ctx.fail.mock.calls[0][0].message.indexOf(message)).toBeGreaterThan(-1);
        expect(ctx.fail.mock.calls[0][0].status).toBe(400);
      });
    });

    describe('fail', () => {
      it('should call next', () => {
        const ctx = {
          next: jest.fn(),
        };
        const err = new Error('test');
        Responses.fail.call(ctx, err);
        expect(ctx.next).toHaveBeenCalledWith(err);
      });
    });
  });
});
