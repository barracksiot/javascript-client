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

function donwloadPackages(packages) {
  var promises = packages.map(function (package) {
    return package.download('/tmp/' + package.reference + '_' + package.version + '_' + package.filename);
  });

  return Promise.all(promises);
}

function handleAvailablePackages(packages) {
  donwloadPackages(packages).then(function (files) {
    console.log('new packages ready to install :');
    files.forEach(function (file) {
      console.log(file);
    });
  }).catch(function (err) {
    console.error('Error while downloading packages', err);
  });
}

function handleChangedPackages(packages) {
  donwloadPackages(packages).then(function (files) {
    console.log('updates ready to install :');
    files.forEach(function (file) {
      console.log(file);
    });
  }).catch(function (err) {
    console.error('Error while downloading packages', err);
  });
}

function handleUnchangedPackages(packages) {
  packages.forEach(function (package) {
    console.log('package ' + package.reference + ' did not change (version' + package.version + ')');
  });
}

function handleUnavailablePackages(packages) {
  packages.forEach(function (package) {
    console.log('package ' + package.reference + ' is not available anymore');
  });
}

function waitAndDisplayUpdate() {
  setTimeout(function () {
    barracks.checkUpdate(device.versionId, { gender: 'Female' }).then(function (response) {
      handleAvailablePackages(response.available);
      handleChangedPackages(response.changed);
      handleUnchangedPackages(response.unchanged);
      handleUnavailablePackages(response.unavailable);
    }).catch(function (err) {
      console.error('Error when checking for a new update: ', err);
      waitAndDisplayUpdate();
    });
  }, 1000);
}

waitAndDisplayUpdate();