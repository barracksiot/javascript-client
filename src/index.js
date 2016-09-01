process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = (function () {
  "use strict";

  var request = require("request");
  var fs = require('fs');
  var md5File = require('md5-file/promise')


  function download(update, options) {
    return new Promise(function (resolve, reject) {
      var downloadParams = {
        url: update.packageInfo.url,
        method: 'GET',
        headers: {
          Authorization: options.apiKey,
        }
      };
      var file = options.downloadDir + "/" + update.versionId;
      var req = request(downloadParams)
        .on('response', function (response) {
          if (response.statusCode != 200) {
            req.abort()
            reject(response.body.error);
          }
        }).pipe(fs.createWriteStream(file))
        .on('close', function () {
          checksum(file, update.packageInfo.md5).then(function () {
            resolve(file);
          }).catch(function (err) {
            reject(err);
          });
        });
    });
  }

  function checksum(file, validSum) {
    return new Promise(function (resolve, reject) {
      md5File(file).then(function (hash) {
        if (hash == validSum)
          resolve()
        else{
          fs.unlink(file, function (err) {
            if (err) {
              console.error('Error when removing file: ' + err);
            } else {
              console.log('Package removed from file system');
            }
          });
          reject('Checksum don\'t match');
        }
      }).catch(function (err) {
        console.log(err)
      });
    });
  }

  function Barracks(options) {
    this.options = {
      baseURL: options.baseURL || 'https://app.barracks.io',
      apiKey: options.apiKey,
      unitId: options.unitId,
      downloadDir: options.downloadLocation || '/tmp'
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
        url: that.options.baseURL + '/api/device/update/check',
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