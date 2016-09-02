'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var ERROR_REQUEST_FAILED              = 'REQUEST_FAILED';
var ERROR_DOWNLOAD_FAILED             = 'DOWNLOAD_FAILED';
var ERROR_UNEXPECTED_SERVER_RESPONSE  = 'UNEXPECTED_SERVER_RESPONSE';

var DEFAULT_BARRACKS_BASE_URL   = 'https://app.barracks.io';
var CHECK_UPDATE_ENDPOINT       = '/api/device/update/check';
var DEFAULT_DOWNLOAD_FILE_PATH  = '/tmp/update.tmp';

var request = require('request');
var downloadChecker = require('./downloadChecker');
var fs = require('fs');


function download(update, options) {
  return new Promise(function (resolve, reject) {
    var downloadParams = {
      url: update.packageInfo.url,
      method: 'GET',
      headers: {
        Authorization: options.apiKey,
      }
    };
    var file = options.downloadFilePath;
    var req = request(downloadParams).on('response', function (response) {
      if (response.statusCode != 200) {
        reject({
          type: ERROR_DOWNLOAD_FAILED,
          message: 'Serveur replied with HTTP ' + response.statusCode
        });
      }
    }).pipe(fs.createWriteStream(file)).on('close', function () {
      downloadChecker.check(file, update.packageInfo.md5).then(function () {
        resolve(file);
      }).catch(function (err) {
        reject(err);
      });
    });
  });
}

function Barracks(options) {
  this.options = {
    baseURL: options.baseURL || DEFAULT_BARRACKS_BASE_URL,
    apiKey: options.apiKey,
    unitId: options.unitId,
    downloadFilePath: options.downloadFilePath || DEFAULT_DOWNLOAD_FILE_PATH
  };
}

Barracks.prototype.checkUpdateAndDownload = function (versionId, customData) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.checkUpdate(versionId, customData).then(function (update) {
      if (update) {
        update.download().then(function (file) {
          resolve(file);
        }).catch(function (err) {
          reject(err);
        });
      } else {
        resolve();
      }
    }).catch(function (err) {
      reject(err);
    });
  });
};

Barracks.prototype.checkUpdate = function (versionId, customData) {
  var that = this;
  return new Promise(function (resolve, reject) {
    var requestOptions = {
      url: that.options.baseURL + CHECK_UPDATE_ENDPOINT,
      method: 'POST',
      headers: {
        'Authorization': that.options.apiKey,
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        unitId: that.options.unitId,
        versionId: versionId,
        customClientData: customData
      })
    };

    request(requestOptions, function (error, response, body) {
      if (error) {
        reject({
          type: ERROR_REQUEST_FAILED,
          message: error
        });
      } else {
        if (response.statusCode === 204) {
          resolve();
        } else if (response.statusCode == 200) {
          var update = Object.assign({}, JSON.parse(body), {
            download: function () {
              return download(update, that.options);
            }
          });
          resolve(update);
        } else {
          reject({
            type: ERROR_UNEXPECTED_SERVER_RESPONSE,
            message: body
          });
        }
      }
    });
  });
};

module.exports = Barracks;