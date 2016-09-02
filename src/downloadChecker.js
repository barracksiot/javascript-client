var fs = require('fs');
var md5File = require('md5-file/promise');

var DELETE_FILE_ERROR_CODE            = 'DELETE_FILE_ERROR';
var CHECKSUM_VERIFICATION_FAILED_CODE = 'CHECKSUM_VERIFICATION_FAILED';
var MD5_HASH_CREATION_FAILED_CODE     = 'MD5_HASH_CREATION_FAILED';

module.exports = {
  check: function (file, validSum) {
    return new Promise(function (resolve, reject) {
      md5File(file).then(function (hash) {
        if (hash == validSum) {
          resolve();
        } else {
          fs.unlink(file, function (err) {
            if (err) {
              reject({
                type: DELETE_FILE_ERROR_CODE,
                message: 'Error when removing file ' + file + ': ' + err 
              });
            }
          });
          reject({
            type: CHECKSUM_VERIFICATION_FAILED_CODE,
            message: 'Checksum don\'t match'
          });
        }
      }).catch(function (err) {
        reject({
          type: MD5_HASH_CREATION_FAILED_CODE,
          message: err
        });
      });
    });
  }
}
