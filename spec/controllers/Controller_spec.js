'use strict';
var Promise = require('bluebird');
var ControllerModule = require('../../src/controllers/Controller');

describe('Controller', function(){
  var Controller;
  it('should export a function', function() {
    expect(typeof ControllerModule).toBe('function');
  });

  beforeEach(function(){
    var ctx = {};
    Controller = ControllerModule.bind(ctx, ctx);
  });

  it('should extend itself', function(){
    var example = 'test';
    var controller = new Controller({
      example: example
    });
    expect(controller.example).toBe(example);
  });

  it('should have a static extend helper method', function(){
    var example = 'test';
    var controller = ControllerModule.extend({
      example: example
    });
    expect(controller.example).toBe(example);
    expect(controller instanceof ControllerModule).toBeTruthy();
  });

  it('should call the init function if found', function() {
    var spy = jest.fn();
    new Controller({ // eslint-disable-line
      init: spy
    });
    expect(spy).toHaveBeenCalled();
  });

  it('getAll should call this.model.readAll()', function(){
    var readAll = jest.fn(function (){
      return Promise.resolve();
    });
    var controller = new Controller({
      model: {
        readAll: readAll
      }
    });
    controller.controller = controller;
    controller.getAll();
    expect(readAll).toHaveBeenCalled();
  });

  it('getOne should call this.model.read()', function () {
    var read = jest.fn(function (id) {
      return Promise.resolve(id);
    });
    var controller = new Controller({
      model: {
        read: read
      }
    });
    controller.controller = controller;
    var id = 1;
    controller.getOne({
      params: {
        id: id
      }
    });
    expect(read).toHaveBeenCalledWith(1);
  });

  it('getOne should call this.notFound if id is NaN', function () {
    var controller = new Controller({});
    controller.notFound = jest.fn();
    controller.getOne({
      params: {
        id: NaN
      }
    });
    expect(controller.notFound).toHaveBeenCalled();
  });

  it('postCreate should call this.model.create()', function () {
    var create = jest.fn(function (body) {
      return Promise.resolve(body);
    });
    var controller = new Controller({
      model: {
        create: create
      }
    });
    controller.controller = controller;
    var body = {
      title : 'test'
    };
    controller.postCreate({
      body: body
    });
    expect(create).toHaveBeenCalledWith(body);
  });

  it('putUpdate should call this.model.update()', function () {
    var update = jest.fn(function (body) {
      return Promise.resolve(body);
    });
    var controller = new Controller({
      model: {
        update: update
      }
    });
    controller.controller = controller;
    var body = {
      title: 'test'
    };
    var id = 1;
    controller.putUpdate({
      params: {
        id: id
      },
      body: body
    });
    expect(update).toHaveBeenCalledWith(body, id);
  });

  it('putUpdate should call this.model.updateAll() when multiple records are passed in', function () {
    var updateAll = jest.fn(function (body) {
      return Promise.resolve(body);
    });
    var controller = new Controller({
      model: {
        updateAll: updateAll
      }
    });
    controller.controller = controller;
    var body = {
      id: 1,
      title: 'test'
    };
    controller.putUpdate({
      params: {},
      body: [body]
    });
    expect(updateAll).toHaveBeenCalled();
  });

  it('deleteOne should call this.model.del()', function () {
    var controller = new Controller({
      model: {
        del: function() {}
      }
    });
    controller.controller = controller;

    var spy = jest.spyOn(controller.model, 'del')
      .mockImplementation(function (id) {
        return Promise.resolve(id);
      });

    var id = 1;
    controller.deleteOne.call(controller, {
      params: {
        id: id
      }
    });
    expect(spy).toHaveBeenCalledWith(id);
  });
});
