var fs = require('fs');
var md5File = require('md5-file/promise');

var ERROR_DELETE_FILE_FAILED            = 'DELETE_FILE_FAILED';
var ERROR_CHECKSUM_VERIFICATION_FAILED  = 'CHECKSUM_VERIFICATION_FAILED';
var ERROR_MD5_HASH_CREATION_FAILED      = 'MD5_HASH_CREATION_FAILED';

function deleteCorruptedFile(file, reject) {
  fs.unlink(file, function (err) {
    if (err) {
      reject({
        type: ERROR_DELETE_FILE_FAILED,
        message: 'Error when removing file ' + file + ': ' + err
      });
    }
  });
}

module.exports = {
  check: function (file, validSum) {
    return new Promise(function (resolve, reject) {
      md5File(file).then(function (hash) {
        if (hash == validSum) {
          resolve();
        } else {
          deleteCorruptedFile(file, reject);
          reject({
            type: ERROR_CHECKSUM_VERIFICATION_FAILED,
            message: 'Checksum don\'t match'
          });
        }
      }).catch(function (err) {
        deleteCorruptedFile(file, reject);
        reject({
          type: ERROR_MD5_HASH_CREATION_FAILED,
          message: err
        });
      });
    });
  }
}
