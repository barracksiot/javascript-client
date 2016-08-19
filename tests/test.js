/*global describe, it, beforeEach, before, afterEach */
/** 1a7b3df2f64488c444d20204cdeb46ddd15792d6ef7f5309f46d697a7d87df8b **/
var chai = require('chai'),
  expect = chai.expect,
  nock = require('nock'),
  fs = require('fs'),
  Barracks = require('../src/index.js'),
  testDir = __dirname,
  baseURL = 'https://barracks.ddns.net',
  nockHeaders = {
    'Authorization': 'validKey',
    'Content-type': 'application/json'
  };
  nockHeaders_dl = {
    'Authorization': 'validKey',
  };

describe('Check for an update : ', function() {

  it("Should return an update when one is available", function(done) {
    var currentVersionId = "v0.0.1";
    var updateVersionId = "v0.0.2";
    var unitId = "unit1";
    var scope = nock(baseURL, { reqheaders: nockHeaders })
      .post('/api/device/update/check', {
        unitId: unitId,
        versionId: currentVersionId
      })
      .reply(200, {
        "versionId": updateVersionId,
        "packageInfo": {
          "url": "http://barracks.ddns.net/update/download/1152723d-a267-4cd5-aaac-511e568d4681",
          "md5": "5f396472788fde9b770bffb7ae2c6deb",
          "size": 1447
        },
        "properties": {
          "jsonkey": "value"
        }
      });

    var barracks = new Barracks({
      apiKey: nockHeaders.Authorization,
      unitId: unitId
    });

    barracks.checkUpdate(currentVersionId)
      .then(function(update) {
        expect(update).to.be.a('object');
        expect(update).to.have.property('versionId', updateVersionId);
        done();
      }).catch(function (err) {
        done(err);
      });
  });

  it("Should not return an update when there is none", function(done) {
    var currentVersionId = "v0.0.1";
    var updateVersionId = "v0.0.2";
    var unitId = "unit1";
    var scope = nock(baseURL, { reqheaders: nockHeaders })
      .post('/api/device/update/check', {
        unitId: unitId,
        versionId: currentVersionId
      })
      .reply(204);

    var barracks = new Barracks({
      apiKey: nockHeaders.Authorization,
      unitId: unitId
    });

    barracks.checkUpdate(currentVersionId)
      .then(function(update) {
        expect(update).to.be.equal(undefined);
        done();
      }).catch(function (err) {
        done(err);
      });
  });

  it("Should download the update when .download is called and the file is valid", function(done) {

    var currentVersionId = "v0.0.1";
    var updateVersionId = "v0.0.2";
    var unitId = "unit1";
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
      .reply(200, function(uri, requestBody) {
        return fs.createReadStream(testDir + '/fixtures/validApplication');
      });

    var barracks = new Barracks({
      apiKey: nockHeaders.Authorization,
      unitId: unitId
    });

    barracks.checkUpdate(currentVersionId)
      .then(function(update){
        update.download(update.file).then(function(res){
          console.log(res);
          done();
        });
      }).catch(function (err) {
        done(err);
      });
  });



});

