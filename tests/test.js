/*global describe, it, beforeEach, before, afterEach */
var chai = require('chai'),
  expect = chai.expect,
  nock = require('nock'),
  fs = require('fs'),
  Barracks = require('../src/index.js'),
  testDir = __dirname,
  baseURL = 'https://domain.name',
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

describe('Check for an update : ', function () {

  it("Should return an update when one is available", function (done) {

    var scope = nock(baseURL, { reqheaders: nockHeaders })
      .post('/api/device/update/check', {
        unitId: unitId,
        versionId: currentVersionId
      })
      .reply(200, {
        "versionId": updateVersionId,
        "packageInfo": {
          "url": baseURL+ 'update/download/1152723d-a267-4cd5-aaac-511e568d4681',
          "md5": "5f396472788fde9b770bffb7ae2c6deb",
          "size": 1447
        },
        "properties": {
          "jsonkey": "value"
        }
      });

    var barracks = new Barracks({
      baseURL: baseURL,
      apiKey: nockHeaders.Authorization,
      unitId: unitId,
      downloadDir: '/tmp/files'
    });

    barracks.checkUpdate(currentVersionId)
      .then(function (update) {
        expect(update).to.be.a('object');
        expect(update).to.have.property('versionId', updateVersionId);
        expect(update).to.have.property('properties');
        expect(update).to.have.property('packageInfo');
        done();
      }).catch(function (err) {
        done(err);
      });
  });

  it("Should not return an update when there is none", function(done) {
    var scope = nock(baseURL, { reqheaders: nockHeaders })
      .post('/api/device/update/check', {
        unitId: unitId,
        versionId: currentVersionId
      })
      .reply(204);

    var barracks = new Barracks({
      baseURL: baseURL,
      apiKey: nockHeaders.Authorization,
      unitId: unitId,
      downloadDir: '/tmp/filesn'
    });

    barracks.checkUpdate(currentVersionId)
      .then(function(update) {
        expect(update).to.be.undefined;
        done();
      }).catch(function (err) {
        done(err);
      });
  });

  it("Should download the update when the file is valid", function (done) {

    var mockFilePath = testDir + '/fixtures/validApplication';

    var ping = nock(baseURL, { reqheaders: nockHeaders })
      .post('/api/device/update/check', {
        unitId: unitId,
        versionId: currentVersionId
      })
      .reply(200, {
        "versionId": updateVersionId,
        "packageInfo": {
          "url": baseURL + "/cdn/filename",
          "md5": "1f1133ee77f0b3c66c948ae376d55715",
          "size": 1447
        },
        "properties": {
          "jsonkey": "value"
        }
      });

    var download = nock(baseURL, { reqheaders: nockHeaders_dl })
      .get('/cdn/filename')
      .replyWithFile(200, mockFilePath);

    var barracks = new Barracks({
      baseURL: baseURL,
      apiKey: nockHeaders.Authorization,
      unitId: unitId,
      downloadDir: testDir + '/fixtures/tmp'
    });

    barracks.checkUpdate(currentVersionId)
      .then(function(update){
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

  it("Should check and download the update simultaneously", function (done) {

    var mockFilePath = testDir + '/fixtures/validApplication';
    var ping = nock(baseURL, { reqheaders: nockHeaders })
      .post('/api/device/update/check', {
        unitId: unitId,
        versionId: currentVersionId
      })
      .reply(200, {
        "versionId": updateVersionId,
        "packageInfo": {
          "url": baseURL + "/cdn/filename",
          "md5": "1f1133ee77f0b3c66c948ae376d55715",
          "size": 1447
        },
        "properties": {
          "jsonkey": "value"
        }
      });

    var download = nock(baseURL, { reqheaders: nockHeaders_dl })
      .get('/cdn/filename')
      .replyWithFile(200, mockFilePath);

    var barracks = new Barracks({
      baseURL: baseURL,
      apiKey: nockHeaders.Authorization,
      unitId: unitId,
      location: testDir + '/fixtures/tmp'
    });

    barracks.checkUpdateAndDownload(currentVersionId)
      .then(function (file) {
        var mockFileContent = fs.readFileSync(mockFilePath).toString();
        var downloadedFileContent = fs.readFileSync(file).toString();
        expect(downloadedFileContent).to.equal(mockFileContent);
        done();
      }).catch(function (err) {
        done(err);
      });
  });

  it("Should delete the update when the file is corrupted", function (done) {

    var mockFilePath = testDir + '/fixtures/validApplication';
    var corruptMockFilePath = testDir + '/fixtures/invalidApplication';
    var ping = nock(baseURL, { reqheaders: nockHeaders })
      .post('/api/device/update/check', {
        unitId: unitId,
        versionId: currentVersionId
      })
      .reply(200, {
        "versionId": updateVersionId,
        "packageInfo": {
          "url": baseURL + "/cdn/filename",
          "md5": "1f1133ee77f0b3c66c948ae376d55715",
          "size": 1447
        },
        "properties": {
          "jsonkey": "value"
        }
      });

    var download = nock(baseURL, { reqheaders: nockHeaders_dl })
      .get('/cdn/filename')
      .replyWithFile(200, corruptMockFilePath);

    var barracks = new Barracks({
      baseURL: baseURL,
      apiKey: nockHeaders.Authorization,
      unitId: unitId,
      location: testDir + '/fixtures/tmp'
    });

    barracks.checkUpdate(currentVersionId)
      .then(function(update){
        update.download(update.file).then(function(file){
          done("MD5 should not match");
        }).catch(function (err) {
          expect(err).to.not.equal(undefined);
          fs.exists(barracks.options.downloadDir + "/" + updateVersionId, function (exists) {
            expect(exists).to.equal(false);
            done();
          });
        });
      }).catch(function (err) {
        done(err);
      });
  });

  it("Should fail when the server responds with error", function (done) {

    var ping = nock(baseURL, { reqheaders: nockHeaders })
      .post('/api/device/update/check', {
        unitId: unitId,
        versionId: currentVersionId
      })
      .reply(400, {
        "body": "Error message"
      });

    var barracks = new Barracks({
      baseURL: baseURL,
      apiKey: nockHeaders.Authorization,
      unitId: unitId,
      location: testDir + '/fixtures/tmp'
    });

    barracks.checkUpdate(currentVersionId)
      .then(function(update){
        update.download(update.file).then(function(file){
          done("Should return error message");
        }).catch(function (err) {
          expect(err).to.not.be.undefined;
          done();
        });
      }).catch(function (err) {
        console.log('err');
        done();
      });
  });
});

