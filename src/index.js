module.exports = (function () {

  "use strict";

  var bodyParser = require('body-parser');
  var request = require("request");
  var fs = require('fs');

  function Barracks(options) {
    this.options = {
      baseURL: options.baseURL || 'https://barracks.ddns.net',
      apiKey: options.apiKey || '1a7b3df2f64488c444d20204cdeb46ddd15792d6ef7f5309f46d697a7d87df8b',
      unitId: options.unitId || 'unit1',
      downloadDir: options.location || './',

    };
  }

  Barracks.prototype.checkUpdate = function(versionId, customData) {
    var that = this;
    return new Promise(function (resolve, reject) {

      var requestOptions = {
        url: that.options.baseURL + '/api/device/update/check',
        method: 'POST',
        headers: {
          'Authorization': that.options.apiKey,
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          unitId: that.options.unitId,
          versionId: versionId,
          additionalProperties: customData
        })
      };

      request(requestOptions, function(error, response, body){
        if (!error) {
          if (response.statusCode === 204) {
            resolve();
          } else {
            var update;
            update.body = JSON.parse(body);

            update.download = function () {
              // http://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js-without-using-third-party-libraries
            };
            resolve(update);
          }
        }
        reject(error);
      });

    });
  };

  return Barracks;

}());