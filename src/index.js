process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = (function () {
  "use strict";

  var request = require("request");
  var fs = require('fs');
  var crypto = require('crypto');
  //require('request-debug')(request);


  function download(update, options) {
    return new Promise(function (resolve, reject) {
      var downloadParams = {
        url: update.packageInfo.url,
        method: 'GET',
        headers: {
          'Authorization': options.apiKey,
        }
      };
      var file = options.downloadDir + "/" + update.versionId;
      request(downloadParams)
        .on('response', function(response) {
          if (response.statusCode != 200) {
            reject(response.body.error);
          } else {
            checksum(file, update.packageInfo.md5).then(function () {
              resolve(file);
            }).catch(function (err) {
              reject(err);
            });
          }
        })
        .pipe(fs.createWriteStream(file));
    });
  }

  function checksum(file, validSum) {
    return new Promise(function (resolve, reject) {
      fs.readFile(file, function (err, buf) {
        if (err) {
          reject(err);
        } else {
          var sumToCheck = crypto.createHash('md5').update(buf).digest("hex");
          if (sumToCheck === validSum){
            resolve();
          } else {
            fs.unlinkSync(file);
            reject('Checksum failed');
          }
        }
      });
    });
  }

  function Barracks(options) {
    this.options = {
      baseURL: options.baseURL || 'https://barracks.ddns.net',
      apiKey: options.apiKey,
      unitId: options.unitId,
      downloadDir: options.downloadLocation || '/tmp'
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
        } else {
          resolve();
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
        if (error) {
          reject(error);
        } else {
          if (response.statusCode === 204) {
            resolve();
          } else {
            var update = Object.assign({}, JSON.parse(body), {
              download: function () {
                return download(update, that.options);
              }
            });
            resolve(update);
          }
        }
      });

    });
  };

  return Barracks;

}());