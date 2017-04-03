function getPackageWithDownload(pckg, downloadFunction) {
  pckg.download = function (filePath) {
    return downloadFunction(pckg, filePath);
  };
  return pckg;
}

module.exports = {
  buildResponse: function (body, downloadFunction) {
    return {
      available: body.available.map(function (pckg) {
        return getPackageWithDownload(pckg, downloadFunction);
      }),
      changed: body.changed.map(function (pckg) {
        return getPackageWithDownload(pckg, downloadFunction);
      }),
      unchanged: body.unchanged,
      unavailable: body.unavailable
    };
  }
};