'use strict';
var wrapRoute = require('../../src/controllers/wrapRoute');
var Promise = require('bluebird');

describe('wrapRoute', function(){
  var ceres;

  beforeEach(function(){
    ceres = {
      log: {
        _ceres: {
          debug: function(){}
        }
      }
    };
  });

	it('should return a function', function(){
    var handler = function() {};
    var ctx = {};
    var result;
    expect(function(){
      result = wrapRoute(handler, ctx, ceres);
    }).not.toThrow();
    expect(typeof result).toBe('function');
  });

  it('should extend "this" with any custom properties', function(){
    var result;
    var handler = function() {
      result = this;
    };
    var ctx = {
      extend: true
    };
    expect(function(){
      result = wrapRoute(handler, ctx, ceres);
      result();
    }).not.toThrow();
    expect(result.extend).toBe(ctx.extend);
  });

  it('should assign "req", "res", "next" to "this" of the handler', function(){
    var result;
    var handler = function() {
      result = this;
    };
    var ctx = {};

    var req = {};
    var res = {};
    var next = function(){};
    expect(function(){
      result = wrapRoute(handler, ctx, ceres);
      result(req, res, next);
    }).not.toThrow();
    expect(result.req).toBe(req);
    expect(result.res).toBe(res);
    expect(result.next).toBe(next);
  });

  it('should call the "next" handler if theres an error', function(){
    var handler = function() {
      throw new Error('ERROR');
    };
    var ctx = {};
    var next = jest.fn();
    var fn = wrapRoute(handler, ctx, ceres);
    fn({}, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('should automatically "send" the result of a promise', function(done){
    var expected = {
      results: []
    };
    var handler = function(){
      return new Promise(function(resolve){
        resolve(expected);
      });
    };
    var ctx = {
      send: jest.fn()
    };
    var res = {
      writable: true
    };
    var fn = wrapRoute(handler, ctx, ceres);
    fn({}, res, function(){})
      .then(function(){
        expect(ctx.send).toHaveBeenCalledWith(expected);
      })
      .finally(() => {
        done();
      });
  });

  it('should not write the response if is not writable', function(done){
    var expected = {
      results: []
    };
    var handler = function(){
      return new Promise(function(resolve){
        resolve(expected);
      });
    };
    var ctx = {
      send: jest.fn()
    };
    var res = {
      writable: false
    };
    var fn = wrapRoute(handler, ctx, ceres);
    fn({}, res, function(){})
      .then(function(){
        expect(ctx.send).not.toHaveBeenCalled();
        done();
      });
  });
});
