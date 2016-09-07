![001501-cloud-location-1.png](https://bitbucket.org/repo/yLK99j/images/4081600440-001501-cloud-location-1.png)

# Barracks SDK for JavaScript
The JavaScript SDK to interact with the [Barracks](https://barracks.io/) API

## Installation

```bash
$ npm install barracks
```

## Usage

Create a Barracks SDK instance:
```js
var Barracks = require('barracks');

var barracks = new Barracks({
  apiKey: '7657657AE76567CD6757EF',
  unitId: 'The unique device identifier'
});
```

Check for an update:
```js
barracks.checkUpdate(currentDeviceVersion, customClientData).then(function (update) {
  if (update) {
    // Do something with the update
  } else {
    // Do something when no updates are available
  }
}).catch(function (err) {
  // Do something with the error
});
```


Check for an update and download it:
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
  // Do something with the error
});
```

Check for an update and download it without chaining the Promises:
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
  // Do something with the check error
});
```

Check for an update and download it with a single function:
```js
barracks.checkUpdateAndDownload(currentDeviceVersion, customClientData).then(function (file) {
  // Do something with the file
}).catch(function (err) {
  // Do something with the error
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