module.exports = {
  buildCheckUpdateResult: function(serverResponse) {
    var result = {};
    Object.keys(serverResponse).forEach(function (key) {
      result[key] = serverResponse[key].map(function (item) {
        return Object.assign({}, item, {
          package: item.component,
          component: undefined
        });
      });
    });
    return result;
  }
};