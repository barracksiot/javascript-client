var fs = require('fs');
var md5File = require('md5-file/promise')

module.exports = {
  check: function (file, validSum) {
    return new Promise(function (resolve, reject) {
      md5File(file).then(function (hash) {
        if (hash == validSum) {
          resolve();
        } else {
          fs.unlink(file, function (err) {
            if (err) {
              throw 'Error when removing file ' + file + ': ' + err;
            }
          });
          reject('Checksum don\'t match');
        }
      }).catch(function (err) {
        reject(err);
      });
    });
  }
}
