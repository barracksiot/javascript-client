var fs = require('fs');
var Barracks = require('../src/index.js');

var args = {};
process.argv.forEach(function (val, index, array) {
  if (index >= 2 && index % 2 === 0) {
    var argName = val.substr(2);
    args[argName] = process.argv[index + 1];
  }
});

/** baseUrl is the URL used for Barracks API. By default, it's http://app.barracks.io **
 ** but it can be changed for your own subdomain for example. See the Barracks        **
 ** documentation for more information.                                               **/
var barracksBaseUrl = args.baseUrl;
/** apiKey is your user api key that you can find on the  **/
var barracksApiKey = args.apiKey;

var device = {
  versionId: 'v0.0.0',
  unitId: 'unit8'
};

var barracks = new Barracks({
  baseURL: barracksBaseUrl,
  apiKey: barracksApiKey,
  unitId: device.unitId,
  downloadDir: '/tmp/files'
});

function waitAndDisplayUpdate() {
  setTimeout(function () {
    barracks.checkUpdate(device.versionId).then(function (update) {
      if (update) {
        console.log('A new update is available!');
        console.log('Version: ' + update.versionId);
        console.log('Properties: ' + JSON.stringify(update.properties));
        return update.download().then(function (file) {
          console.log("Download");
          fs.readFile(file, 'utf8', function (err, data) {
            if (err) {
              console.err('Error when reading file: ' + err);
              waitAndDisplayUpdate();
            } else {
              device.versionId = update.versionId;
              fs.unlink(file, function (err) {
                if (err) {
                  console.error('Error when removing file: ' + err);
                } else {
                  console.log('Package removed from file system');
                }
                waitAndDisplayUpdate();
              });
            }
          });
        }).catch(function (err) {
          console.log(err);
        });
      } else {
        console.log("No updates available");
        waitAndDisplayUpdate();
      }
    }).catch(function (err) {
      console.error('Error when checking for a new update: ' + err);
      waitAndDisplayUpdate();
    });
  }, 1000);
}

waitAndDisplayUpdate();
