var Barracks = require("../src/index.js");

var myDevice = {
  unitId: "unit1",
  versionId: "0.0.1-alpha",
  customData: {
    color: "Blue",
    type: "Best"
  }
};

var barracks = new Barracks({
  unitId: myDevice.unitId
});


barracks.checkUpdate(myDevice.versionId, myDevice.customData).then(function (update) {
  if (update) {
    update.download().then(function (file) {
      console.log('checkUpdate success: ' + file);
    }).catch(function (err) {
      console.log(err);
    });
  }
}).catch(function (err) {
  console.trace(err);
});

  barracks.checkUpdateAndDownload(myDevice.versionId, myDevice.customData)
    .then(function (file) {
      console.log('checkUpdateAndDownload Success: ' + file);
    }).catch(function (err) {
      console.log(err);
    });
