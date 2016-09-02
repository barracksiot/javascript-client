/*global describe, it, beforeEach, before, afterEach */
var chai = require('chai');
var expect = chai.expect;
var nock = require('nock');
var fs = require('fs');
var proxyquire =  require('proxyquire');


var TEST_DIRECTORY            = __dirname;
var DOWNLOAD_FILE_PATH        = '/tmp/myUpdate.tmp';
var BASE_URL                  = 'https://domain.name';
var CHECK_UPDATE_ENDPOINT     = '/api/device/update/check';
var DOWNLOAD_UPDATE_ENDPOINT  = '/api/device/update/download/';
var CORRUPT_MOCK_FILE_PATH    = TEST_DIRECTORY + '/fixtures/invalidApplication';
var MOCK_FILE_PATH            = TEST_DIRECTORY + '/fixtures/validApplication';
var MOCK_FILE_MD5_HASH        = '1f1133ee77f0b3c66c948ae376d55715';
var MOCK_FILE_SIZE            = 1447;
var CURRENT_VERSION_ID        = 'v0.0.1';
var UPDATE_VERSION_ID         = 'v0.0.2';
var UPDATE_ID                 = '1152723d-a267-4cd5-aaac-511e568d4681';
var UNIT_ID                   = 'unit1';
var NOCK_HEADERS = {
  'Authorization': 'validKey',
  'Content-type': 'application/json'
};
var NOCK_CDN_HEADERS = {
  'Authorization': 'validKey'
};

var unlinkMock;
var md5File;

var mockedServer;
var mockedCDNServer;
var barracks;
var updateProperties;

proxyfyModules();

function proxyfyModules() {
  proxyquire('../src/downloadChecker', {
    'fs': {
      unlink: function (file, callback) {
        unlinkMock(file, callback);
      }
    },
    'md5-file/promise': function (file) {
      return md5File(file);
    }
  });
}

function getCheckUpdateEntrypoint(customClientData) {
  return mockedServer.post(CHECK_UPDATE_ENDPOINT, {
    unitId:           UNIT_ID,
    versionId:        CURRENT_VERSION_ID,
    customClientData: customClientData
  });
}

function getDownloadUpdateEntrypoint(updateId) {
  return mockedCDNServer.get(DOWNLOAD_UPDATE_ENDPOINT + updateId);
}

beforeEach(function () {
  var Barracks = require('../src/index.js');

  unlinkMock = function (file, callback) {
    var fs = require('fs');
    fs.unlink(file, callback);
  };
  md5File = function(file) {
    var md5File = require('md5-file/promise');
    return md5File(file);
  };

  mockedServer    = nock(BASE_URL, { reqheaders: NOCK_HEADERS });
  mockedCDNServer = nock(BASE_URL, { reqheaders: NOCK_CDN_HEADERS });

  barracks = new Barracks({
    baseURL:          BASE_URL,
    apiKey:           NOCK_HEADERS.Authorization,
    unitId:           UNIT_ID,
    downloadFilePath: DOWNLOAD_FILE_PATH
  });

  updateProperties = { jsonkey: 'value' };
  packageInfo = {
    url:  BASE_URL + DOWNLOAD_UPDATE_ENDPOINT + UPDATE_ID,
    md5:  MOCK_FILE_MD5_HASH,
    size: MOCK_FILE_SIZE
  };
});

describe('Check for an update : ', function () {

  it('Should return an update when one is available', function (done) {
    getCheckUpdateEntrypoint().reply(200, {
      versionId:    UPDATE_VERSION_ID,
      packageInfo:  packageInfo,
      properties:   updateProperties
    });

    barracks.checkUpdate(CURRENT_VERSION_ID).then(function (update) {
      expect(update).to.be.a('object');
      expect(update).to.have.property('versionId');
      expect(update.versionId).to.equals(UPDATE_VERSION_ID);

      expect(update).to.have.property('properties');
      expect(update.properties).to.be.a('object');
      expect(update.properties).to.have.property('jsonkey', updateProperties.jsonkey);

      expect(update).to.have.property('packageInfo');
      expect(update.packageInfo).to.be.a('object');
      expect(update.packageInfo).to.have.property('url', packageInfo.url);
      expect(update.packageInfo).to.have.property('md5', packageInfo.md5);
      expect(update.packageInfo).to.have.property('size', packageInfo.size);

      done();
    }).catch(function (err) {
      done(err);
    });
  });


  it('Should not return an update when there is none', function(done) {
    getCheckUpdateEntrypoint().reply(204);

    barracks.checkUpdate(CURRENT_VERSION_ID).then(function(update) {
      expect(update).to.be.undefined;
      done();
    }).catch(function (err) {
      done(err);
    });
  });


  it('Should download the update when the file is valid', function (done) {
    getCheckUpdateEntrypoint().reply(200, {
      versionId:    UPDATE_VERSION_ID,
      packageInfo:  packageInfo,
      properties:   updateProperties
    });

    getDownloadUpdateEntrypoint(UPDATE_ID).replyWithFile(200, MOCK_FILE_PATH);

    barracks.checkUpdate(CURRENT_VERSION_ID).then(function(update) {
      update.download(update.file).then(function(file) {
        var mockFileContent = fs.readFileSync(MOCK_FILE_PATH).toString();
        var downloadedFileContent = fs.readFileSync(file).toString();
        expect(downloadedFileContent).to.equal(mockFileContent);
        done();
      }).catch(function (err) {
        done(err);
      });
    }).catch(function (err) {
      done(err);
    });
  });


  it('Should check and download the update simultaneously', function (done) {
    getCheckUpdateEntrypoint().reply(200, {
      versionId:    UPDATE_VERSION_ID,
      packageInfo:  packageInfo,
      properties:   updateProperties
    });

    getDownloadUpdateEntrypoint(UPDATE_ID).replyWithFile(200, MOCK_FILE_PATH);

    barracks.checkUpdateAndDownload(CURRENT_VERSION_ID).then(function (file) {
      var mockFileContent = fs.readFileSync(MOCK_FILE_PATH).toString();
      var downloadedFileContent = fs.readFileSync(file).toString();
      expect(downloadedFileContent).to.equal(mockFileContent);
      done();
    }).catch(function (err) {
      done(err);
    });
  });


  it('Should fail when the server responds with error', function (done) {
    getCheckUpdateEntrypoint().reply(400, {
      body: 'Error message'
    });

    barracks.checkUpdate(CURRENT_VERSION_ID).then(function(update) {
      done('Should be an error');
    }).catch(function (err) {
      done();
    });
  });


  it('Should build the correct request with custom client data', function (done) {
    var customClientData = {
      customData1: 'custom value 1',
      customData2: 'custom value 2'
    }

    getCheckUpdateEntrypoint(customClientData).reply(200, {
      versionId:    UPDATE_VERSION_ID,
      packageInfo:  packageInfo,
      properties:   updateProperties
    });

    barracks.checkUpdate(CURRENT_VERSION_ID, customClientData).then(function (update) {
      done();
    }).catch(function (err) {
      done(err);
    });
  });


  it('Should delete the update when the file is corrupted', function (done) {    
    getCheckUpdateEntrypoint().reply(200, {
      versionId:    UPDATE_VERSION_ID,
      packageInfo:  packageInfo,
      properties:   updateProperties
    });

    getDownloadUpdateEntrypoint(UPDATE_ID).replyWithFile(200, CORRUPT_MOCK_FILE_PATH);

    barracks.checkUpdate(CURRENT_VERSION_ID).then(function(update) {
      update.download(update.file).then(function(file) {
        done('MD5 should not match');
      }).catch(function (err) {
        expect(err).to.not.equal(undefined);
        expect(barracks.options.downloadFilePath).to.be.a('string');
        fs.exists(barracks.options.downloadFilePath, function (exists) {
          expect(exists).to.equal(false);
          done();
        });
      });
    }).catch(function (err) {
      done(err);
    });
  });


  it('Should throw a "DELETE_FILE_FAILED" exception when the file deletion fail', function (done) {
    var errorMessage = 'error deleting file';
    var expectedErrorMessage = 'Error when removing file ' + DOWNLOAD_FILE_PATH + ': ' + errorMessage;
    unlinkMock = function (file, callback) {
      callback(errorMessage);
    };

    getCheckUpdateEntrypoint().reply(200, {
      versionId:    UPDATE_VERSION_ID,
      packageInfo:  packageInfo,
      properties:   updateProperties
    });

    getDownloadUpdateEntrypoint(UPDATE_ID).replyWithFile(200, CORRUPT_MOCK_FILE_PATH);

    barracks.checkUpdate(CURRENT_VERSION_ID).then(function(update) {
      update.download(update.file).then(function(file) {
        done('Download should fail');
      }).catch(function (err) {
        expect(err).to.be.a('object');
        expect(err).to.have.property('type', 'DELETE_FILE_FAILED');
        expect(err).to.have.property('message', expectedErrorMessage);
        done();
      });
    }).catch(function (err) {
      done(err);
    });
  });


  it('Should throw a "CHECKSUM_VERIFICATION_FAILED" exception when the md5 check fail', function (done) {
    var expectedErrorMessage = 'Checksum don\'t match';
    getCheckUpdateEntrypoint().reply(200, {
      versionId:    UPDATE_VERSION_ID,
      packageInfo:  packageInfo,
      properties:   updateProperties
    });

    getDownloadUpdateEntrypoint(UPDATE_ID).replyWithFile(200, CORRUPT_MOCK_FILE_PATH);

    barracks.checkUpdate(CURRENT_VERSION_ID).then(function(update) {
      update.download(update.file).then(function(file) {
        done('Download should fail');
      }).catch(function (err) {
        expect(err).to.be.a('object');
        expect(err).to.have.property('type', 'CHECKSUM_VERIFICATION_FAILED');
        expect(err).to.have.property('message', expectedErrorMessage);
        done();
      });
    }).catch(function (err) {
      done(err);
    });
  });


  it('Should throw a "MD5_HASH_CREATION_FAILED" exception when the md5 creation fail', function (done) {
    var errorMessage = 'error creating md5 of file ';
    var expectedErrorMessage = errorMessage + DOWNLOAD_FILE_PATH;
    md5File = function(file) {
      return Promise.reject(errorMessage + file);
    };

    getCheckUpdateEntrypoint().reply(200, {
      versionId:    UPDATE_VERSION_ID,
      packageInfo:  packageInfo,
      properties:   updateProperties
    });

    getDownloadUpdateEntrypoint(UPDATE_ID).replyWithFile(200, MOCK_FILE_PATH);

    barracks.checkUpdate(CURRENT_VERSION_ID).then(function(update) {
      update.download(update.file).then(function(file) {
        done('Download should fail');
      }).catch(function (err) {
        expect(err).to.be.a('object');
        expect(err).to.have.property('type', 'MD5_HASH_CREATION_FAILED');
        expect(err).to.have.property('message', expectedErrorMessage);
        done();
      });
    }).catch(function (err) {
      done(err);
    });
  });
});
