'use strict';

angular.module('copayApp.services').factory('walletColorService', function(configService, $log) {
  var root = {
    setWalletColor: setWalletColor
  };

  return root;

  function setWalletColor (walletId, network) {
    var hexColor;

    if (!walletId || !network) return;

    switch(network) {
      case 'dash':      hexColor = '#1d71b8'; break;
      case 'deuscoin':  hexColor = '#0000AA'; break;
      case 'aureus':    hexColor = '#e4992e'; break;
      case 'litecoin':  hexColor = '#91caf4'; break;
      case 'dogecoin':  hexColor = '#FF599E'; break;
      case 'zcash':     hexColor = '#FBD35B'; break;
      default:          hexColor = '#bb1a1a';
    }

    var opts = { colorFor: {} };

    opts.colorFor[walletId] = hexColor;

    configService.set(opts, function(err) {
      if (err) $log.warn(err);
    });
  }
});
