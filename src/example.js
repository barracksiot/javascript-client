var Barracks = require("barracks");

var myDevice = {
  unitId: "unit1",
  versionId: "0.0.1-alpha",
  customData: {
    color: "Blue",
    type: "Best"
  }
};

var barracks = new Barracks({
  apiKey: "blablabla",
  unitId: myDevice.unitId
});

barracks.checkUpdate(myDevice.versionId, myDevice.customData).then(function (update) {
  if (update) {
    return update.download();
  } else {
    return Promise.resolve();
  }
}).then(function (file) {
  // Do something with the file
}).catch(function (err) {
  console.log(err);
});


barracks.checkUpdate(myDevice.versionId, myDevice.customData).then(function (update) {
  if (update) {
    update.download().then(function (file) {
      // Do something with the file
      // 
    }).catch(function (err) {
      console.log(err);
    });
  }
}).catch(function (err) {
  console.log(err);
});


barracks.checkUpdateAndDownload(myDevice.versionId, myDevice.customData).then(function (file) {
  // Do something
}).catch(function (err) {
  console.log(err);
});

