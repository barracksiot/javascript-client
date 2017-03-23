module.exports = {
  buildCheckUpdateResult: function(serverResponse, barracks) {
    var result = {};
    Object.keys(serverResponse).forEach(function (key) {
      result[key] = serverResponse[key].map(function (item) {
        var result = JSON.parse(JSON.stringify(item));
        result.package = item.component;
        delete result.component;

        if (key === 'available' || key === 'changed') {
          result.download = function (filePath) {
            return barracks.downloadPackage(result, filePath);
          };
        }

        return result;
      });
    });
    return result;
  }
};