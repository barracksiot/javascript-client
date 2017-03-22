'use strict';

var ERROR_REQUEST_FAILED              = 'REQUEST_FAILED';

var ERROR_UNEXPECTED_SERVER_RESPONSE  = 'UNEXPECTED_SERVER_RESPONSE';

var DEFAULT_BARRACKS_BASE_URL   = 'https://app.barracks.io';
var CHECK_UPDATE_ENDPOINT       = '/api/device/v2/update/check';

require('./polyfill');
var request = require('request');

function Barracks(options) {
  this.options = {
    baseURL: options.baseURL || DEFAULT_BARRACKS_BASE_URL,
    apiKey: options.apiKey,
    unitId: options.unitId
  };

  if (options.allowSelfSigned && options.allowSelfSigned === true) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

Barracks.prototype.checkUpdate = function (components, customClientData) {
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
        customClientData: customClientData,
        components: components
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
        resolve(JSON.parse(body));
      } else {
        reject({
          type: ERROR_UNEXPECTED_SERVER_RESPONSE,
          message: body
        });
      }
    });
  });
};

module.exports = Barracks;