/*global describe, it, beforeEach, before, afterEach */
var chai = require('chai'),
  expect = chai.expect,
  nock = require('nock'),
  fs = require('fs'),
  Barracks = require('../src/index.js'),
  testDir = __dirname,
  baseURL = 'https://domain.name',
  mockFilePath = testDir + '/fixtures/validApplication',
  corruptMockFilePath = testDir + '/fixtures/invalidApplication',
  nockHeaders = {
    'Authorization': 'validKey',
    'Content-type': 'application/json'
  },
  nockHeaders_dl = {
    'Authorization': 'validKey',
  },
  currentVersionId = 'v0.0.1',
  updateVersionId = 'v0.0.2',
  unitId = 'unit1';

beforeEach(function() {
  mockedServer = nock(baseURL, { reqheaders: nockHeaders });
  mockedCDNServer = nock(baseURL, { reqheaders: nockHeaders_dl });
  barracks = new Barracks({
    baseURL: baseURL,
    apiKey: nockHeaders.Authorization,
    unitId: unitId,
    downloadDir: '/tmp/files'
  });
});

describe('Check for an update : ', function () {

  it('Should return an update when one is available', function (done) {
    var updateProperties = { jsonkey: "value" };
    var packageInfo = {
      url: baseURL+ 'update/download/1152723d-a267-4cd5-aaac-511e568d4681',
      md5: '5f396472788fde9b770bffb7ae2c6deb',
      size: 1447
    };

    mockedServer.post('/api/device/update/check', {
      unitId: unitId,
      versionId: currentVersionId,
      customClientData: undefined
    }).reply(200, {
      versionId: updateVersionId,
      packageInfo: packageInfo,
      properties: updateProperties
    });

    barracks.checkUpdate(currentVersionId).then(function (update) {
      expect(update).to.be.a('object');
      expect(update).to.have.property('versionId');
      expect(update.versionId).to.equals(updateVersionId);

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
    mockedServer.post('/api/device/update/check', {
      unitId: unitId,
      versionId: currentVersionId,
      customClientData: undefined
    }).reply(204);

    barracks.checkUpdate(currentVersionId).then(function(update) {
      expect(update).to.be.undefined;
      done();
    }).catch(function (err) {
      done(err);
    });
  });


  it('Should download the update when the file is valid', function (done) {
    var properties = { jsonkey: 'value' };
    var packageInfo = {
      url: baseURL + '/cdn/filename',
      md5: '1f1133ee77f0b3c66c948ae376d55715',
      size: 1447
    };

    mockedServer.post('/api/device/update/check', {
      unitId: unitId,
      versionId: currentVersionId,
      customClientData: undefined
    }).reply(200, {
      versionId: updateVersionId,
      packageInfo: packageInfo,
      properties: properties
    });

    mockedCDNServer.get('/cdn/filename').replyWithFile(200, mockFilePath);

    barracks.checkUpdate(currentVersionId).then(function(update){
      update.download(update.file).then(function(file){
        var mockFileContent = fs.readFileSync(mockFilePath).toString();
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
    var properties = { jsonkey: 'value' };
    var packageInfo = {
      url: baseURL + '/cdn/filename',
      md5: '1f1133ee77f0b3c66c948ae376d55715',
      size: 1447
    };

    mockedServer.post('/api/device/update/check', {
      unitId: unitId,
      versionId: currentVersionId,
      customClientData: undefined
    }).reply(200, {
      versionId: updateVersionId,
      packageInfo: packageInfo,
      properties: properties
    });

    mockedCDNServer.get('/cdn/filename').replyWithFile(200, mockFilePath);

    barracks.checkUpdateAndDownload(currentVersionId).then(function (file) {
      var mockFileContent = fs.readFileSync(mockFilePath).toString();
      var downloadedFileContent = fs.readFileSync(file).toString();
      expect(downloadedFileContent).to.equal(mockFileContent);
      done();
    }).catch(function (err) {
      done(err);
    });
  });


  it('Should delete the update when the file is corrupted', function (done) {
    var properties = { jsonkey: 'value' };
    var packageInfo = {
      url: baseURL + '/cdn/filename',
      md5: '1f1133ee77f0b3c66c948ae376d55715',
      size: 1447
    };
    
    mockedServer.post('/api/device/update/check', {
      unitId: unitId,
      versionId: currentVersionId,
      customClientData: undefined
    }).reply(200, {
      versionId: updateVersionId,
      packageInfo: packageInfo,
      properties: properties
    });

    mockedCDNServer.get('/cdn/filename').replyWithFile(200, corruptMockFilePath);

    barracks.checkUpdate(currentVersionId).then(function(update){
      update.download(update.file).then(function(file){
        done('MD5 should not match');
      }).catch(function (err) {
        expect(err).to.not.equal(undefined);
        fs.exists(barracks.options.downloadDir + '/' + updateVersionId, function (exists) {
          expect(exists).to.equal(false);
          done();
        });
      });
    }).catch(function (err) {
      done(err);
    });
  });


  it('Should fail when the server responds with error', function (done) {
    mockedServer.post('/api/device/update/check', {
      unitId: unitId,
      versionId: currentVersionId,
      customClientData: undefined
    })
    .reply(400, {
      body: 'Error message'
    });

    barracks.checkUpdate(currentVersionId).then(function(update){
      update.download(update.file).then(function(file){
        done('Should return error message');
      }).catch(function (err) {
        expect(err).to.not.be.undefined;
        done();
      });
    }).catch(function (err) {
      console.log('err');
      done();
    });
  });


  it('Should build the correct request with custom client data', function (done) {
    var properties = { jsonkey: 'value' };
    var packageInfo = {
      url: baseURL + 'update/download/1152723d-a267-4cd5-aaac-511e568d4681',
      md5: '5f396472788fde9b770bffb7ae2c6deb',
      size: 1447
    };
    var customClientData = {
      customData1: 'custom value 1',
      customData2: 'custom value 2'
    }

    mockedServer.post('/api/device/update/check', {
      unitId: unitId,
      versionId: currentVersionId,
      customClientData: customClientData
    }).reply(200, {
      versionId: updateVersionId,
      packageInfo: packageInfo,
      properties: properties
    });

    barracks.checkUpdate(currentVersionId, customClientData).then(function (update) {
      done();
    }).catch(function (err) {
      done(err);
    });

  });
});

