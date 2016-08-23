var fs = require('fs');
var Barracks = require('../src/index.js');

var args = {};
process.argv.forEach(function (val, index, array) {
	if (index >= 2 && index % 2 === 0) {
		var argName = val.substr(2);
		args[argName] = process.argv[index + 1];
	}
});

var barracksBaseUrl = args.baseUrl;
var barracksApiKey = args.apiKey;

var device = {
	versionId: 'v0.0.0',
	unitId: 'unit8'
};

var barracks = new Barracks({
	baseURL: barracksBaseUrl,
  apiKey: barracksApiKey,
  unitId: device.unitId,
  downloadDir: './updates'
});


function waitAndDisplayUpdate() {
	setTimeout(function () {
		barracks.checkUpdate(device.versionId).then(function (update) {
			if (update) {
				console.log('A new update is available!');
				console.log('Version: ' + update.versionId);
				console.log('Properties: ' + JSON.stringify(update.properties));
				return update.download().then(function (file) {
					fs.readFile(file, 'utf8', function (err, data) {
						if (err) {
					  	console.err('Error when reading file: ' + err);
					  	waitAndDisplayUpdate();
					  } else {
					  	console.log('Package content:');
							console.log(data);
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
