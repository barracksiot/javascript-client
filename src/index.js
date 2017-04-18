'use strict';

var ERROR_REQUEST_FAILED              = 'REQUEST_FAILED';
var ERROR_DOWNLOAD_FAILED             = 'DOWNLOAD_FAILED';
var ERROR_UNEXPECTED_SERVER_RESPONSE  = 'UNEXPECTED_SERVER_RESPONSE';
var ERROR_MISSING_MANDATORY_ARGUMENT  = 'MISSING_MANDATORY_ARGUMENT';

var DEFAULT_BARRACKS_BASE_URL         = 'https://app.barracks.io';
var GET_DEVICE_PACKAGES_ENDPOINT      = '/api/device/resolve';

require('es6-promise').polyfill();
var responseBuilder = require('./responseBuilder');
var fs = require('fs');
var request = require('request');
var fileHelper = require('./fileHelper');

function Barracks(options) {
  this.options = {
    baseURL: options.baseURL || DEFAULT_BARRACKS_BASE_URL,
    apiKey: options.apiKey
  };

  if (options.allowSelfSigned && options.allowSelfSigned === true) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

Barracks.prototype.getDevicePackages = function (unitId, packages, customClientData) {
  var that = this;
  return new Promise(function (resolve, reject) {
    if (!unitId || !packages) {
      reject({
        type: ERROR_MISSING_MANDATORY_ARGUMENT,
        message: 'missing or empty unitId or packages arguments'
      });
    }

    var requestOptions = {
      url: that.options.baseURL + GET_DEVICE_PACKAGES_ENDPOINT,
      method: 'POST',
      headers: {
        'Authorization': that.options.apiKey,
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        unitId: unitId,
        customClientData: customClientData,
        components: packages
      })
    };

    request(requestOptions, function (error, response, body) {
      if (error) {
        reject({
          type: ERROR_REQUEST_FAILED,
          requestError: error,
          message: 'Check Update request failed: ' + error.message
        });
      } else if (response.statusCode == 200) {
        resolve(responseBuilder.buildResponse(JSON.parse(body), that.downloadPackage.bind(that)));
      } else {
        reject({
          type: ERROR_UNEXPECTED_SERVER_RESPONSE,
          message: body
        });
      }
    });
  });
};

Barracks.prototype.downloadPackage = function (packageInfo, filePath) {
  var that = this;
  return new Promise(function (resolve, reject) {
    if (!packageInfo) {
      reject({
        type: ERROR_MISSING_MANDATORY_ARGUMENT,
        message: 'missing or empty packageInfo argument'
      });
    }

    var downloadParams = {
      url: packageInfo.url,
      method: 'GET',
      headers: {
        Authorization: that.options.apiKey
      }
    };

    var fileStream = fs.createWriteStream(filePath);
    request(downloadParams).on('response', function (response) {
      if (response.statusCode != 200) {
        fileStream.emit('error', {
          type: ERROR_DOWNLOAD_FAILED,
          message: 'Server replied with HTTP ' + response.statusCode
        });
      }
    }).pipe(fileStream).on('close', function () {
      fileHelper.checkMd5(filePath, packageInfo.md5).then(function () {
        resolve(filePath);
      }).catch(function (err) {
        fileHelper.deleteFile(filePath, reject);
        reject(err);
      });
    }).on('error', function (err) {
      fileHelper.deleteFile(filePath, reject);
      reject(err);
    });
  });
};

module.exports = Barracks;