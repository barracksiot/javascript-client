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
var barracksApiKey = args.apiKey;

if (!barracksApiKey) {
  console.log('Argument --apiKey <API_KEY> is mandatory.');
  console.log('<API_KEY> is your user api key that you can find on the Account page of Barracks.');
  console.log('You can also use the argument --baseUrl <BARRACKS_URL> if you want to request another domain than the default one.');
  process.exit();
}

var device = {
  versionId: 'v0.0.0',
  unitId: 'unit9'
};

var barracks = new Barracks({
  baseURL: barracksBaseUrl,
  apiKey: barracksApiKey,
  unitId: device.unitId,
  downloadFilePath: '/tmp/file.tmp'
});

function waitAndDisplayUpdate() {
  setTimeout(function () {
    barracks.checkUpdate(device.versionId, { gender: 'Female' }).then(function (update) {
      if (update) {
        console.log('A new update is available!');
        console.log('Version: ' + update.versionId);
        console.log('Custom Update Data: ' + JSON.stringify(update.customUpdateData));          
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
        console.log('No updates available');
        waitAndDisplayUpdate();
      }
    }).catch(function (err) {
      console.error('Error when checking for a new update: ' + err);
      waitAndDisplayUpdate();
    });
  }, 1000);
}

waitAndDisplayUpdate();
