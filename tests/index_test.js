/* jshint expr: true, maxstatements: 100 */
/* global describe, it, beforeEach */

var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var chai = require('chai');
var expect = chai.expect;
var proxyquire =  require('proxyquire');
var Stream = require('stream');

chai.use(sinonChai);

var UNIT_ID = 'unit1';
var API_KEY = 'validKey';
var CUSTOM_CLIENT_DATA = {
  aKey: 'aValue',
  anotherKey: true
};

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
    expect(barracks.getDevicePackages).to.be.a('function');
    expect(barracks.options).to.deep.equals({
      apiKey: API_KEY,
      baseURL: expectedBaseUrl
    });
  }

  it('Should return the Barracks object with default values when minimums options given', function () {
    // Given
    var options = {
      apiKey: API_KEY
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
      allowSelfSigned: true
    };

    // When
    var barracks = new Barracks(options);

    // Then
    validateBarracksObject(barracks, 'https://app.barracks.io');
    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).to.be.equals('0');
  });
});

describe('getDevicePackages(unitId, components, customClientData) ', function () {

  var barracks;
  var getDevicePackagesComponentsUrl = '/api/device/resolve';
  var requestMock = function () {};
  var buildResponseMock = function () {};

  function getRequestPayloadForComponents(components, customClientData) {
    return {
      url: 'https://app.barracks.io' + getDevicePackagesComponentsUrl,
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        unitId: UNIT_ID,
        customClientData: customClientData,
        components: components
      })
    };
  }

  beforeEach(function () {
    requestMock = function () {};
    buildResponseMock = function () {};

    var Barracks = proxyquire('../src/index.js', {
      'request': function (options, callback) {
        return requestMock(options, callback);
      },
      './responseBuilder': {
        buildResponse: function (body, downloadFunction) {
          return buildResponseMock(body, downloadFunction);
        }
      }
    });

    barracks = new Barracks({
      apiKey: API_KEY,
      unitId: UNIT_ID
    });
  });

  it('Should reject MISSING_MANDATORY_ARGUMENT error when no unitId given', function (done) {
    // Given
    var components = [ component1, component2 ];

    // When / Then
    barracks.getDevicePackages(undefined, components).then(function () {
      done('should have failed');
    }).catch(function (err) {
      expect(err).to.deep.equals({
        type: 'MISSING_MANDATORY_ARGUMENT',
        message: 'missing or empty unitId or packages arguments'
      });
      done();
    });
  });

  it('Should reject MISSING_MANDATORY_ARGUMENT error when empty unitId given', function (done) {
    // Given
    var components = [ component1, component2 ];

    // When / Then
    barracks.getDevicePackages('', components).then(function () {
      done('should have failed');
    }).catch(function (err) {
      expect(err).to.deep.equals({
        type: 'MISSING_MANDATORY_ARGUMENT',
        message: 'missing or empty unitId or packages arguments'
      });
      done();
    });
  });

  it('Should reject MISSING_MANDATORY_ARGUMENT error when no packages given', function (done) {
    // When / Then
    barracks.getDevicePackages(UNIT_ID).then(function () {
      done('should have failed');
    }).catch(function (err) {
      expect(err).to.deep.equals({
        type: 'MISSING_MANDATORY_ARGUMENT',
        message: 'missing or empty unitId or packages arguments'
      });
      done();
    });
  });

  it('Should reject MISSING_MANDATORY_ARGUMENT error when empty packages given', function (done) {
    // When / Then
    barracks.getDevicePackages(UNIT_ID, '').then(function () {
      done('should have failed');
    }).catch(function (err) {
      expect(err).to.deep.equals({
        type: 'MISSING_MANDATORY_ARGUMENT',
        message: 'missing or empty unitId or packages arguments'
      });
      done();
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
    barracks.getDevicePackages(UNIT_ID, components).then(function () {
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
    barracks.getDevicePackages(UNIT_ID, components).then(function () {
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
    var buildResponseSpy = sinon.spy();
    buildResponseMock = function (body, downloadFunction) {
      buildResponseSpy(body, downloadFunction);
      return componentInfo;
    };

    // When / Then
    barracks.getDevicePackages(UNIT_ID, components).then(function (result) {
      expect(result).to.deep.equals(componentInfo);
      expect(requestSpy).to.have.been.calledOnce;
      expect(requestSpy).to.have.been.calledWithExactly(
        getRequestPayloadForComponents(components),
        sinon.match.func
      );
      expect(buildResponseSpy).to.have.been.calledOnce;
      expect(buildResponseSpy).to.have.been.calledWithExactly(
        componentInfo,
        sinon.match.func
      );
      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('Should send customClientData and return server response when server return 200 OK', function (done) {
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
    var buildResponseSpy = sinon.spy();
    buildResponseMock = function (body, downloadFunction) {
      buildResponseSpy(body, downloadFunction);
      return componentInfo;
    };

    // When / Then
    barracks.getDevicePackages(UNIT_ID, components, CUSTOM_CLIENT_DATA).then(function (result) {
      expect(result).to.deep.equals(componentInfo);
      expect(requestSpy).to.have.been.calledOnce;
      expect(requestSpy).to.have.been.calledWithExactly(
        getRequestPayloadForComponents(components, CUSTOM_CLIENT_DATA),
        sinon.match.func
      );
      expect(buildResponseSpy).to.have.been.calledOnce;
      expect(buildResponseSpy).to.have.been.calledWithExactly(
        componentInfo,
        sinon.match.func
      );
      done();
    }).catch(function (err) {
      done(err);
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
    var buildResponseSpy = sinon.spy();
    buildResponseMock = function (body, downloadFunction) {
      buildResponseSpy(body, downloadFunction);
      return componentInfo;
    };

    // When / Then
    barracks.getDevicePackages(UNIT_ID, components).then(function (result) {
      expect(result).to.deep.equals(componentInfo);
      expect(requestSpy).to.have.been.calledOnce;
      expect(requestSpy).to.have.been.calledWithExactly(
        getRequestPayloadForComponents(components),
        sinon.match.func
      );
      expect(buildResponseSpy).to.have.been.calledOnce;
      expect(buildResponseSpy).to.have.been.calledWithExactly(
        componentInfo,
        sinon.match.func
      );
      done();
    }).catch(function (err) {
      done(err);
    });
  });
});

describe('downloadPackage(packageInfo, filePath) ', function () {

  var barracks;
  var createWriteStreamMock = function () {};
  var checkMd5Mock = function () {};
  var deleteFileMock = function () {};
  var requestMock = function () {};
  var uuidMock = function() {};

  beforeEach(function () {
    var Barracks = proxyquire('../src/index.js', {
      'fs': {
        createWriteStream: function (path) {
          return createWriteStreamMock(path);
        }
      },
      './fileHelper': {
        checkMd5: function (file, checksum) {
          return checkMd5Mock(file, checksum);
        },
        deleteFile: function (file, reject) {
          return deleteFileMock(file, reject);
        }
      },
      'request': function (params) {
        return requestMock(params);
      },
      'uuid/v1': function () {
        return uuidMock();
      }
    });

    barracks = new Barracks({
      apiKey: API_KEY,
      unitId: UNIT_ID
    });
  });

  it('Should reject MISSING_MANDATORY_ARGUMENT error when no packageInfo given', function (done) {
    // When / Then
    barracks.downloadPackage().then(function () {
      done('Should have failed');
    }).catch(function (err) {
      expect(err).to.deep.equals({
        type: 'MISSING_MANDATORY_ARGUMENT',
        message: 'missing or empty packageInfo argument'
      });
      done();
    });
  });

  it('Should reject MISSING_MANDATORY_ARGUMENT error when empty packageInfo given', function (done) {
    // When / Then
    barracks.downloadPackage('').then(function () {
      done('Should have failed');
    }).catch(function (err) {
      expect(err).to.deep.equals({
        type: 'MISSING_MANDATORY_ARGUMENT',
        message: 'missing or empty packageInfo argument'
      });
      done();
    });
  });

  it('Should return ERROR_DOWNLOAD_FAILED when server return http code other than 200 OK', function (done) {
    // Given
    var response = { statusCode: 500 };
    var packageInfo = {
      package: 'abc.edf',
      version: '0.0.1',
      url: 'https://not.barracks.io/path/to/file',
      size: 42,
      md5: 'deadbeefbadc0ffee'
    };
    var filePath = 'path/to/file.sh';

    var fileStream = new Stream();
    var createWriteStreamSpy = sinon.spy();
    createWriteStreamMock = function (path) {
      createWriteStreamSpy(path);
      return fileStream;
    };

    var requestStream = new Stream();
    var requestSpy = sinon.spy();
    requestMock = function (params) {
      requestSpy(params);
      return requestStream;
    };

    var deleteFileSpy = sinon.spy();
    deleteFileMock = function (file, reject) {
      deleteFileSpy(file, reject);
    };

    setTimeout(function () {
      requestStream.emit('response', response);
    }, 75);

    // When / Then
    barracks.downloadPackage(packageInfo, filePath).then(function () {
      done('Should have failed');
    }).catch(function (err) {
      expect(err).to.deep.equals({
        type: 'DOWNLOAD_FAILED',
        message: 'Server replied with HTTP ' + response.statusCode
      });
      expect(createWriteStreamSpy).to.have.been.calledOnce;
      expect(createWriteStreamSpy).to.have.been.calledWithExactly(filePath);
      expect(requestSpy).to.have.been.calledOnce;
      expect(requestSpy).to.have.been.calledWithExactly({
        url: packageInfo.url,
        method: 'GET',
        headers: {
          Authorization: API_KEY
        }
      });
      expect(deleteFileSpy).to.have.been.calledOnce;
      expect(deleteFileSpy).to.have.been.calledWithExactly(
        filePath,
        sinon.match.func
      );
      done();
    });
  });

  it('Should return an error when md5 check fail', function (done) {
    // Given
    var response = { statusCode: 200 };
    var md5Error = 'MD5 do not match !!';
    var packageInfo = {
      package: 'abc.edf',
      version: '0.0.1',
      url: 'https://not.barracks.io/path/to/file',
      size: 42,
      md5: 'deadbeefbadc0ffee'
    };
    var filePath = 'path/to/file.sh';

    var fileStream = new Stream();
    var createWriteStreamSpy = sinon.spy();
    createWriteStreamMock = function (path) {
      createWriteStreamSpy(path);
      return fileStream;
    };

    var requestStream = new Stream();
    var requestSpy = sinon.spy();
    requestMock = function (params) {
      requestSpy(params);
      return requestStream;
    };

    var checkMd5Spy = sinon.spy();
    checkMd5Mock = function (path, checksum) {
      checkMd5Spy(path, checksum);
      return Promise.reject(md5Error);
    };

    var deleteFileSpy = sinon.spy();
    deleteFileMock = function (file, reject) {
      deleteFileSpy(file, reject);
    };

    setTimeout(function () {
      requestStream.emit('response', response);
    }, 75);
    setTimeout(function () {
      fileStream.emit('close');
    }, 95);

    // When / Then
    barracks.downloadPackage(packageInfo, filePath).then(function () {
      done('Should have failed');
    }).catch(function (err) {
      expect(err).to.be.equals(md5Error);
      expect(createWriteStreamSpy).to.have.been.calledOnce;
      expect(createWriteStreamSpy).to.have.been.calledWithExactly(filePath);
      expect(requestSpy).to.have.been.calledOnce;
      expect(requestSpy).to.have.been.calledWithExactly({
        url: packageInfo.url,
        method: 'GET',
        headers: {
          Authorization: API_KEY
        }
      });
      expect(checkMd5Spy).to.have.been.calledOnce;
      expect(checkMd5Spy).to.have.been.calledWithExactly(
        filePath,
        packageInfo.md5
      );
      expect(deleteFileSpy).to.have.been.calledOnce;
      expect(deleteFileSpy).to.have.been.calledWithExactly(
        filePath,
        sinon.match.func
      );
      done();
    });
  });

  it('Should return the path to downloaded file when request successful', function (done) {
    // Given
    var response = { statusCode: 200 };
    var packageInfo = {
      package: 'abc.edf',
      version: '0.0.1',
      url: 'https://not.barracks.io/path/to/file',
      size: 42,
      md5: 'deadbeefbadc0ffee'
    };
    var filePath = 'path/to/file.sh';

    var fileStream = new Stream();
    var createWriteStreamSpy = sinon.spy();
    createWriteStreamMock = function (path) {
      createWriteStreamSpy(path);
      return fileStream;
    };

    var requestStream = new Stream();
    var requestSpy = sinon.spy();
    requestMock = function (params) {
      requestSpy(params);
      return requestStream;
    };

    var checkMd5Spy = sinon.spy();
    checkMd5Mock = function (path, checksum) {
      checkMd5Spy(path, checksum);
      return Promise.resolve();
    };

    setTimeout(function () {
      requestStream.emit('response', response);
    }, 75);
    setTimeout(function () {
      fileStream.emit('close');
    }, 95);

    // When / Then
    barracks.downloadPackage(packageInfo, filePath).then(function (result) {
      expect(result).to.be.equals(filePath);
      expect(createWriteStreamSpy).to.have.been.calledOnce;
      expect(createWriteStreamSpy).to.have.been.calledWithExactly(filePath);
      expect(requestSpy).to.have.been.calledOnce;
      expect(requestSpy).to.have.been.calledWithExactly({
        url: packageInfo.url,
        method: 'GET',
        headers: {
          Authorization: API_KEY
        }
      });
      expect(checkMd5Spy).to.have.been.calledOnce;
      expect(checkMd5Spy).to.have.been.calledWithExactly(
        filePath,
        packageInfo.md5
      );
      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('Should generate random path for the file to download when no filePath given', function (done) {
    // Given
    var response = { statusCode: 200 };
    var packageInfo = {
      package: 'abc.edf',
      version: '0.0.1',
      url: 'https://not.barracks.io/path/to/file',
      filename: 'myFile.sh',
      size: 42,
      md5: 'deadbeefbadc0ffee'
    };

    var fileStream = new Stream();
    var createWriteStreamSpy = sinon.spy();
    createWriteStreamMock = function (path) {
      createWriteStreamSpy(path);
      return fileStream;
    };

    var requestStream = new Stream();
    var requestSpy = sinon.spy();
    requestMock = function (params) {
      requestSpy(params);
      return requestStream;
    };

    var checkMd5Spy = sinon.spy();
    checkMd5Mock = function (path, checksum) {
      checkMd5Spy(path, checksum);
      return Promise.resolve();
    };

    var uuidSpy = sinon.spy();
    var randomUuid = 'qaserdxcftygvghujhnbnjkmklknbhgfcxdesazw';
    uuidMock = function () {
      uuidSpy();
      return randomUuid;
    };

    var expectedFilePath = randomUuid + '_' + packageInfo.filename;

    setTimeout(function () {
      requestStream.emit('response', response);
    }, 75);
    setTimeout(function () {
      fileStream.emit('close');
    }, 95);

    // When / Then
    barracks.downloadPackage(packageInfo).then(function (result) {
      expect(result).to.be.equals(expectedFilePath);
      expect(uuidSpy).to.have.been.calledOnce;
      expect(uuidSpy).to.have.been.calledWithExactly();
      expect(createWriteStreamSpy).to.have.been.calledOnce;
      expect(createWriteStreamSpy).to.have.been.calledWithExactly(expectedFilePath);
      expect(requestSpy).to.have.been.calledOnce;
      expect(requestSpy).to.have.been.calledWithExactly({
        url: packageInfo.url,
        method: 'GET',
        headers: {
          Authorization: API_KEY
        }
      });
      expect(checkMd5Spy).to.have.been.calledOnce;
      expect(checkMd5Spy).to.have.been.calledWithExactly(
        expectedFilePath,
        packageInfo.md5
      );
      done();
    }).catch(function (err) {
      done(err);
    });
  });
});
