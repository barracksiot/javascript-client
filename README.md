# Barracks SDK for JavaScript
The JavaScript SDK to interact with the [Barracks](https://barracks.io/) API

![001501-cloud-location-1.png](https://bitbucket.org/repo/yLK99j/images/729711508-001501-cloud-location-1.png)

## Installation

```bash
$ npm install barracks
```

## Usage

Create a Barracks SDK instance:
```js
var Barracks = require("barracks");

var barracks = new Barracks({
  apiKey: "7657657AE76567CD6757EF",
  unitId: "My unique device identifier"
});
```

Check for an update:
```js
barracks.checkUpdate(currentDeviceVersion, customData).then(function (update) {
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
barracks.checkUpdate(currentDeviceVersion, customData).then(function (update) {
  if (update) {
    return update.download();
  } else {
    return Promise.resolve();
  }
}).then(function (file) {
  if (file) {
    // Do something with the file
  }
}).catch(function (err) {
  // Do something with the error
});
```

or, if you don't want to chain the Promises:
```js
barracks.checkUpdate(currentDeviceVersion, customData).then(function (update) {
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

or the with a single function:
```js
barracks.checkUpdateAndDownload(currentDeviceVersion, customData).then(function (file) {
  // Do something with the file
}).catch(function (err) {
  // Do something with the error
});
```

## Docs & Community

* [Website and Documentation](https://barracks.io/)
* [Github Organization](https://github.com/barracksiot) for other official SDKs

## License

  [Apache License, Version 2.0](LICENSE)