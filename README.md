[![Build Status](https://travis-ci.org/barracksiot/javascript-client.svg?branch=master)](https://travis-ci.org/barracksiot/javascript-client) [![Coverage Status](https://coveralls.io/repos/github/barracksiot/javascript-client/badge.svg?branch=master)](https://coveralls.io/github/barracksiot/javascript-client?branch=master) [![npm version](https://badge.fury.io/js/barracks-sdk.svg)](https://badge.fury.io/js/barracks-sdk)

![Barracks logo](https://barracks.io/wp-content/uploads/2016/09/barracks_logo_green.png)

# Barracks SDK for JavaScript
The JavaScript SDK to interact with the [Barracks](https://barracks.io/) API

## Installation

```bash
$ npm install barracks-sdk
```

## Usage

### Create a Barracks SDK instance:
Get your user api key from the Account page of the [Barracks application](https://app.barracks.io/account).

#### Default Barracks SDK instance :
```js
var Barracks = require('barracks-sdk');

var barracks = new Barracks({
  apiKey: 'Your user API key',
  unitId: 'The unique device identifier'
});
```

#### Custom Barracks SDK instance :
You can specify two optionnals attributes to the Barracks SDK if you want to use a proxy for your devices.
With ```baseURL``` you can give the address of your proxy that use to contact Barracks, and the ```allowSelfSigned``` boolean allow you to have a self signed SSL certificate on your proxy server.
Default value of ```baseURL``` is ```https://app.barracks.io```.
Default value of ```allowSelfSigned``` is ```false```.

```js
var Barracks = require('barracks-sdk');

var barracks = new Barracks({
  apiKey: 'Your user API key',
  unitId: 'The unique device identifier',
  baseURL: 'https://proxy.to.barracks.io',
  allowSelfSigned: true
});
```

### Check for new packages and package updates:
```js
var packages = [
  {
    reference: 'package.1.ref',
    version: '1.2.3'
  },
  {
    reference: 'package.2.ref',
    version: '4.5.6'
  }
];
var customClientData = {
  userEmail: 'email@gmail.com',
  location: {
    lgn: -77.695313,
    lat: 40.103286
  }
};

barracks.getDevicePackages(unitId, packages, customClientData).then(function (packagesInfo) {
  packagesInfo.available.forEach(function (packageInfo) {
    // Do something with the newly available packages
  });

  packagesInfo.changed.forEach(function (packageInfo) {
    // Do something with the updated packages
  });

  packagesInfo.unchanged.forEach(function (packageInfo) {
    // Do something with the unchanged packages
  });

  packagesInfo.unavailable.forEach(function (packageInfo) {
    // Do something with the unavailable packages
  });
}).catch(function (err) {
  // Do something with the error (See error handling section)
});
```

The ```getDevicePackages``` response is always as follow :

```js
{
  available: [
    // List of packages newly available for the device
    {
      reference: "abc.edf",
      version: "0.0.1",
      url: "https://app.barracks.io/path/to/package/version/",
      md5: "deadbeefbadc0ffee",
      size: 42,
      filename: 'aFile.sh',
      download: function (filePath) {} // Function to download package
    }
  ],
  changed: [
    // List of packages already installed on the device that have a new version
    {
      reference: "abc.edf",
      version: "0.0.1",
      url: "https://app.barracks.io/path/to/package/version/",
      md5: "deadbeefbadc0ffee",
      size: 42,
      filename: 'aFile.sh',
      download: function (filePath) {} // Function to download package
    }
  ],
  unchanged: [
    // List of packages already installed on the device that still have the same version
    {
      reference: "abc.edf",
      version: "0.0.1",
    }
  ],
  unavailable: [
    // List of packages already installed on the device that cannot be used by the device anymore
    {
      reference: "abc.edf",
    }
  ]
}
```

### Download a package

Once you have the response from getDevicePackages, you'll be able to download file for all packages that are available for the device (packages that are in the ```available```, and ```changed``` lists of the response).

The ```filePath``` argument of the download function is optionnal. The default value will be as follow:
```<random-uuid>_<original-filename>```

```js
var packages = [
  {
    reference: 'package.1.ref',
    version: '1.2.3'
  },
  {
    reference: 'package.2.ref',
    version: '4.5.6'
  }
];

barracks.getDevicePackages(unitId, packages, customClientData).then(function (packagesInfo) {
  var downloadAvailablePackagesPromise = Promise.all(
    packagesInfo.available.map(function (packageInfo) {
      return packageInfo.download('/tmp/' + package.filename); // Return a Promise
    })
  );

  var downloadChangedPackagesPromise = Promise.all(
    packagesInfo.changed.map(function (packageInfo) {
      return packageInfo.download('/tmp/' + package.filename); // Return a Promise
    })
  );

  return Promise.all(downloadAvailablePackagesPromise, downloadChangedPackagesPromise);
}).then(function (files) {
  var downloadedAvailableFiles = files[0]; // Result of downloadAvailablePackagesPromise
  var downloadedChangedFiles = files[1]; // Result of downloadChangedPackagesPromise
  /*
    Do something with the downloaded files here
  */
}).catch(function (err) {
  // Do something with the error (See error handling section)
});
```


## Error Handling

All errors returned by the SDK follow the same object format:
```js
{
  type: 'ERROR_TYPE',
  message: 'Details about the error'
}
```

Error type can be one of the the following:

* `MISSING_MANDATORY_ARGUMENT`, is returned by both `Barracks.getDevicePackages()` and `Package.download()`. It indicate that one or more of the mandatory arguments are missing.
* `REQUEST_FAILED`, is returned by `Barracks.getDevicePackages()` method if the getDevicePackage request fails. The error object also contains one additional property `requestError` that is the `Error` object returned by the [request](https://www.npmjs.com/package/request) library.
* `UNEXPECTED_SERVER_RESPONSE`, is returned by `Barracks.getDevicePackages()` method if the HTTP response code is not `200`.
* `DOWNLOAD_FAILED`, is returned by `Package.download()` method if the download of a package fails.
* `DELETE_FILE_FAILED`, is returned by `Package.download()` method if the SDK fail to delete a package that did not pass the MD5 checksum verification.
* `CHECKSUM_VERIFICATION_FAILED`, is returned by `Package.download()` method if the MD5 checksum verification of the package downloaded fails.
* `MD5_HASH_CREATION_FAILED`, is returned by `Package.download()` method if the SDK is not able to generate the MD5 checksum of the package downloaded.

## Docs & Community

* [Website and Documentation](https://barracks.io/)
* [Github Organization](https://github.com/barracksiot) for other official SDKs

## License

  [Apache License, Version 2.0](LICENSE)
