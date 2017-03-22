/* jshint expr: true */
/* global describe, it, beforeEach */

var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var chai = require('chai');
var expect = chai.expect;
var proxyquire =  require('proxyquire');

chai.use(sinonChai);

var UNIT_ID = 'unit1';
var API_KEY = 'validKey';

var component1 = {
  reference: 'component.1.ref',
  version: '1.2.3'
};
var component2 = {
  reference: 'component.2.ref',
  version: '4.5.6'
};

describe('Constructor : ', function () {

  var Barracks;

  beforeEach(function () {
    Barracks = require('../src/index.js');
  });

  function validateBarracksObject(barracks, expectedBaseUrl) {
    expect(barracks).to.be.an('object');
    expect(barracks.options).to.be.an('object');
    expect(barracks.checkUpdate).to.be.a('function');
    expect(barracks.options).to.deep.equals({
      apiKey: API_KEY,
      unitId: UNIT_ID,
      baseURL: expectedBaseUrl
    });
  }

  it('Should return the Barracks object with default values when minimums options given', function () {
    // Given
    var options = {
      apiKey: API_KEY,
      unitId: UNIT_ID
    };

    // When
    var barracks = new Barracks(options);

    // Then
    validateBarracksObject(barracks, 'https://app.barracks.io');
  });

  it('Should return the Barracks object with baseUrl overriden when url option given', function () {
    // Given
    var url = 'not.barracks.io';
    var options = {
      apiKey: API_KEY,
      unitId: UNIT_ID,
      baseURL: url
    };

    // When
    var barracks = new Barracks(options);

    // Then
    validateBarracksObject(barracks, url);
  });

  it('Should return the Barracks object that do not accept self signed cert when option given with invalid value', function () {
    // Given
    var options = {
      apiKey: API_KEY,
      unitId: UNIT_ID,
      allowSelfSigned: 'plop'
    };

    // When
    var barracks = new Barracks(options);

    // Then
    validateBarracksObject(barracks, 'https://app.barracks.io');
    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).to.be.equals(undefined);
  });

  it('Should return the Barracks object thta accept self signed cert when option given', function () {
    // Given
    var options = {
      apiKey: API_KEY,
      unitId: UNIT_ID,
      allowSelfSigned: true
    };

    // When
    var barracks = new Barracks(options);

    // Then
    validateBarracksObject(barracks, 'https://app.barracks.io');
    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).to.be.equals('0');
  });
});

describe('checkUpdate(components, customClientData) ', function () {

  var barracks;
  var requestMock = function () {};

  function getRequestPayloadForComponents(components) {
    return {
      url: 'https://app.barracks.io/api/device/v2/update/check',
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        unitId: UNIT_ID,
        customClientData: undefined,
        components: components
      })
    };
  }

  beforeEach(function () {
    var Barracks = proxyquire('../src/index.js', {
      'request': function (options, callback) {
        return requestMock(options, callback);
      }
    });

    barracks = new Barracks({
      apiKey: API_KEY,
      unitId: UNIT_ID
    });
  });

  it('Should return request failed error when request failed', function (done) {
    // Given
    var error = { message: 'Error occured' };
    var components = [ component1, component2 ];
    var requestSpy = sinon.spy();
    requestMock = function (options, callback) {
      requestSpy(options, callback);
      callback(error);
    };

    // When / Then
    barracks.checkUpdate(components).then(function () {
      done('should have failed');
    }).catch(function (err) {
      expect(err).to.deep.equals({
        type: 'REQUEST_FAILED',
        requestError: error,
        message: 'Check Update request failed: ' + error.message
      });
      expect(requestSpy).to.have.been.calledOnce;
      expect(requestSpy).to.have.been.calledWithExactly(
        getRequestPayloadForComponents(components),
        sinon.match.func
      );
      done();
    });
  });

  it('Should return unexpected server response error when server do not return 200 OK', function (done) {
    // Given
    var response = { body: 'Internal error', statusCode: 500 };
    var components = [ component1, component2 ];
    var requestSpy = sinon.spy();
    requestMock = function (options, callback) {
      requestSpy(options, callback);
      callback(undefined, response, response.body);
    };

    // When / Then
    barracks.checkUpdate(components).then(function () {
      done('should have failed');
    }).catch(function (err) {
      expect(err).to.deep.equals({
        type: 'UNEXPECTED_SERVER_RESPONSE',
        message: response.body
      });
      expect(requestSpy).to.have.been.calledOnce;
      expect(requestSpy).to.have.been.calledWithExactly(
        getRequestPayloadForComponents(components),
        sinon.match.func
      );
      done();
    });
  });

  it('Should return server response when server return 200 OK', function (done) {
    // Given
    var componentInfo = {
      available:[],
      changed:[],
      unchanged:[],
      unavailable:[]
    };
    var response = {
      body: JSON.stringify(componentInfo),
      statusCode: 200
    };
    var components = [ component1, component2 ];
    var requestSpy = sinon.spy();
    requestMock = function (options, callback) {
      requestSpy(options, callback);
      callback(undefined, response, response.body);
    };

    // When / Then
    barracks.checkUpdate(components).then(function (result) {
      expect(result).to.deep.equals(componentInfo);
      expect(requestSpy).to.have.been.calledOnce;
      expect(requestSpy).to.have.been.calledWithExactly(
        getRequestPayloadForComponents(components),
        sinon.match.func
      );
      done();
    }).catch(function (err) {
      done(err);
    });
  });
});
