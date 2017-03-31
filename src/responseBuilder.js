function getPackageWithDownload(pckg, barracks) {
  pckg.download = function (filePath) {
    return barracks.downloadPackage(pckg, filePath);
  };
  return pckg;
}

module.exports = {
  buildResponse: function (body, barracks) {
    return {
      available: body.available.map(function (pckg) {
        return getPackageWithDownload(pckg, barracks);
      }),
      changed: body.changed.map(function (pckg) {
        return getPackageWithDownload(pckg, barracks);
      }),
      unchanged: body.unchanged,
      unavailable: body.unavailable
    };
  }
};