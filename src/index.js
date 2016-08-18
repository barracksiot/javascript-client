process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = (function () {

  "use strict";

  var request = require("request");
  var fs = require('fs');
  var md5 = require('md5');
  //require('request-debug')(request);

  function Barracks(options) {
    this.options = {
      baseURL: options.baseURL || 'https://barracks.ddns.net',
      apiKey: options.apiKey || '1a7b3df2f64488c444d20204cdeb46ddd15792d6ef7f5309f46d697a7d87df8b',
      unitId: options.unitId || 'unit1',
      downloadDir: options.location || './tmp/'
    };
  }

  Barracks.prototype.checkUpdateAndDownload = function(versionId, customData) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.checkUpdate(versionId, customData).then(function (update) {
        if (update) {
          update.download().then(function (file) {
            resolve(file);
          }).catch(function (err) {
            reject(err);
          });
        }
      }).catch(function (err) {
        reject(err);
      });
    });
  };

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
            var update = {};
            update.meta = JSON.parse(body);
            update.download = function(){
              return that.download(update);
            };
            resolve(update);
          }
        }
        reject(error);
      });

    });
  };

  Barracks.prototype.checksum = function(update) {
    var validSum = update.meta.packageInfo.md5;
    var isValid = false;

    return new Promise(function (resolve, reject) {
      fs.readFile(update.file, function(err, buf) {
        var actualSum = md5(buf);
        if (actualSum === validSum){
          reject();
        } else {
          reject('Checksum failed');
        }
      });
    });
  };

  Barracks.prototype.download = function(update) {
    var that = this;

    return new Promise(function (resolve, reject) {
      var downloadParams = {
        url: update.meta.packageInfo.url,
        method: 'GET',
        headers: {
          'Authorization': that.options.apiKey,
        }
      };
      update.file = that.options.downloadDir + update.meta.versionId;

      request(downloadParams)
        .on('response', function(response) {
          if (response.statusCode != 200){
            reject(response.statusCode);
          } else {
            if( that.checksum(update) ){
              resolve(update.file);
            } else {
              reject('Checksum failed');
            }
          }
        })
        .pipe(fs.createWriteStream(update.file));
    });
  };

  return Barracks;

}());