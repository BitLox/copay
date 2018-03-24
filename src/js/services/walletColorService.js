'use strict';

angular.module('copayApp.services').factory('walletColorService', function(configService, $log) {
  var root = {
    setWalletColor: setWalletColor
  };

  return root;

  function setWalletColor (walletId, hexColor) {
    if (!hexColor) return;

    var opts = { colorFor: {} };

    opts.colorFor[walletId] = hexColor;

    configService.set(opts, function(err) {
      if (err) $log.warn(err);
    });
  }
});
