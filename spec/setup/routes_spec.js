const express = require('express');
const setupRoutes = require('../../src/setup/routes');
const TestController = require('../helpers/TestController');

describe('routes', function() {
  let ceres;
  let ran = false;

  beforeEach(function() {
    ran = false;
    // Setup mock router
    TestController.router = function() {
      ran = true;
      return new express.Router();
    };

    ceres = {
      log: {
        _ceres: {
          silly() {},
          error: console.error,
        },
      },
      config: {
        cache: false,
        folders: {
          controllers: '.',
        },
      },
    };
  });

  it('should call the router function on controller', function() {
    ceres.config.controllers = {
      './spec/helpers/TestController': '/',
    };
    const router = setupRoutes(ceres, 'controllers');
    expect(typeof router).toBe('function');
    expect(ran).toBe(true);
  });
});
