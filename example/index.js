var Barracks = require('../src/index.js');

var args = {};
process.argv.forEach(function (val, index) {
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

function handleResponse(response) {
  response.available.forEach(function (package) {
    console.log('package ' + package.package + ' (version ' + package.version + ') is now available');
  });

  response.changed.forEach(function (package) {
    console.log('package ' + package.package + ' can be updated to version ' + package.version);
  });

  response.unchanged.forEach(function (package) {
    console.log('package ' + package.package + ' did not change (version' + package.version + ')');
  });

  response.unavailable.forEach(function (package) {
    console.log('package ' + package.package + ' is not available anymore');
  });
}

function waitAndDisplayUpdate() {
  setTimeout(function () {
    barracks.checkUpdate(device.versionId, { gender: 'Female' }).then(function (response) {
      handleResponse(response);
    }).catch(function (err) {
      console.error('Error when checking for a new update: ', err);
      waitAndDisplayUpdate();
    });
  }, 1000);
}

waitAndDisplayUpdate();