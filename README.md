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

#### Basic Barracks SDK instance :
```js
var Barracks = require('barracks-sdk');

var barracks = new Barracks({
  apiKey: 'Your user API key',
  unitId: 'The unique device identifier'
});
```

#### Custom Barracks SDK instance :
You can specify two optionnals attributes to the Barracks SDK if you want to use a proxy for your devices.
With ```baseURL``` you can give the address of your proxy that use use to contact Barracks, and the ```allowSelfSigned``` boolean allow you to have a self signed SSL certificate on your proxy server.
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

### Check for an update:
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

barracks.checkUpdate(packages, customClientData).then(function (packagesInfo) {
  packagesInfo.available.forEach(function (package) {
    // Do something with the newly available packages
  });

  packagesInfo.changed.forEach(function (package) {
    // Do something with the updated packages
  });

  packagesInfo.unchanged.forEach(function (package) {
    // Do something with the unchanged packages
  });

  packagesInfo.unavailable.forEach(function (package) {
    // Do something with the unavailable packages
  });
}).catch(function (err) {
  // Do something with the error (See error handling section)
});
```

The ```checkUpdate``` response is always as follow :

```js
{
  "available":[
    // List of packages newly available for the device
    {
      "package": "abc.edf",
      "version": "0.0.1",
      "url":"https://dtc.io/",
      "size": 42,
      "md5":"deadbeefbadc0ffee"
    }
  ],
  "changed":[
    // List of packages already installed on the device that can be updated
    {
      "package": "abc.edf",
      "version": "0.0.1",
      "url":"https://dtc.io/",
      "size": 42,
      "md5":"deadbeefbadc0ffee"
    }
  ],
  "unchanged":[
    // List of packages already installed on the device that did not changed
    {
      "package": "abc.edf",
      "version": "0.0.1",
    }
  ],
  "unavailable":[
    // List of packages already installed on the device that cannot be used by the device anymore
    {
      "package": "abc.edf",
    }
  ]
}
```

<!-- 

### Check for an update and download it:
```js
barracks.checkUpdate(currentDeviceVersion, customClientData).then(function (update) {
  if (update) {
    return update.download();
  }
  return Promise.resolve();
}).then(function (file) {
  if (file) {
    // Do something with the file
  }
}).catch(function (err) {
  // Do something with the error (See error handling section)
});
```


### Check for an update and download it without chaining the Promises:
```js
barracks.checkUpdate(currentDeviceVersion, customClientData).then(function (update) {
  if (update) {
    update.download().then(function (file) {
      // Do something with the file
    }).catch(function (err) {
      // Do something with the download error
    });
  }
}).catch(function (err) {
  // Do something with the error (See error handling section)
});
```
 -->

## Error Handling

All errors returned by the SDK follow the same object format:
```js
{
  type: 'ERROR_TYPE',
  message: 'Details about the error'
}
```

Error type can be one of the the following:

* `REQUEST_FAILED`, is returned by both `Barracks.checkUpdate()` and `Barracks.checkUpdateAndDownload()` methods if the check update request fails. The error object also contains one additional property `requestError` that is the `Error` object returned by the [request](https://www.npmjs.com/package/request) library.
* `UNEXPECTED_SERVER_RESPONSE`, is returned by both `Barracks.checkUpdate()` and `Barracks.checkUpdateAndDownload()` methods if the HTTP response code is not `200` (a new update is available) or `204` (no update available).
* `DOWNLOAD_FAILED`, is returned by both `Update.download()` and `Barracks.checkUpdateAndDownload()` methods if the download of an update package fails.
* `DELETE_FILE_FAILED`, is returned by both `Update.download()` and `Barracks.checkUpdateAndDownload()` methods if the SDK fail to delete an update package that did not pass the MD5 checksum verification.
* `CHECKSUM_VERIFICATION_FAILED`, is returned by both `Update.download()` and `Barracks.checkUpdateAndDownload()` methods if the MD5 checksum verification of the update package downloaded fails.
* `MD5_HASH_CREATION_FAILED`, is returned by both `Update.download()` and `Barracks.checkUpdateAndDownload()` methods if the SDK is not able to generate the MD5 checksum of the update package downloaded.

## Docs & Community

* [Website and Documentation](https://barracks.io/)
* [Github Organization](https://github.com/barracksiot) for other official SDKs

## License

  [Apache License, Version 2.0](LICENSE)