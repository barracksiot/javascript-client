module.exports = {
  buildCheckUpdateResult: function(serverResponse) {
    var result = {};
    Object.keys(serverResponse).forEach(function (key) {
      result[key] = serverResponse[key].map(function (item) {
        var result = item;
        result.package = item.component;
        delete result.component;
        return result;
      });
    });
    return result;
  }
};