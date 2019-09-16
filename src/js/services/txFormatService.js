'use strict';

angular.module('copayApp.services').factory('txFormatService', function($filter, bwcService, rateService, configService, lodash, customNetworks) {
  var root = {};

  root.Utils = bwcService.getUtils();


  root.formatAmount = function(satoshis, fullPrecision) {
    var config = configService.getSync().wallet.settings;
    if (config.unitCode == 'sat') return satoshis;
    //TODO : now only works for english, specify opts to change thousand separator and decimal separator
    var opts = {
      fullPrecision: !!fullPrecision
    };
    return this.Utils.formatAmount(satoshis, config.unitCode, opts);
  };

  root.formatAmountStr = function(satoshis) {
    if (isNaN(satoshis)) return;
    var config = configService.getSync().wallet.settings;
    return root.formatAmount(satoshis);// + ' ' + config.unitName;
  };

  root.toFiat = function(satoshis, code, network, cb) {
    if (isNaN(satoshis)) return;
    var val = function() {
      var v1 = rateService.toFiat(satoshis, code, network);
      if (!v1) return null;

      return v1.toFixed(2);
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) return null;
      return val();
    };
  };

  root.formatToUSD = function(satoshis, network, cb) {

    if (isNaN(satoshis)) return;
    var val = function() {
      var v1 = rateService.toFiat(satoshis, 'USD', network);
      if (!v1) return null;

      return v1.toFixed(2);
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) return null;
      return val();
    };
  };

  root.formatAlternativeStr = function(satoshis, network, cb) {
    if (isNaN(satoshis)) return;
    var config = configService.getSync().wallet.settings;

    var val = function() {
      var v1 = parseFloat((rateService.toFiat(satoshis, config.alternativeIsoCode, network)));
      v1 = $filter('formatFiatAmount')(v1);
      if (!v1) return null;

      return v1 + ' ' + config.alternativeIsoCode;
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) return null;
      return val();
    }
  };

  root.formatFormerAlternativeStr = function(satoshis, network, customRate, cb) {
    if (isNaN(satoshis)) return;
    var config = configService.getSync().wallet.settings;

    var val = function() {
      var v1 = parseFloat((rateService.toFiat(satoshis, config.alternativeIsoCode, network, customRate)));
      v1 = $filter('formatFiatAmount')(v1);
      if (!v1) return null;

      return v1 + ' ' + config.alternativeIsoCode;
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) return null;
      return val();
    }
  };

  root.alternativeAmountWithSymbol = function(satoshis, network, cb) {
    if (isNaN(satoshis)) return;
    var config = configService.getSync().wallet.settings;
    var _symbol = '≈';

    var val = function() {
      var fiat = rateService.toFiat(satoshis, config.alternativeIsoCode, network) || 0;

      if (fiat.toFixed(2) === '0.00' && fiat > 0) {
        _symbol = '<';
      }

      fiat = $filter('formatFiatAmount')(fiat);

      if (!fiat) return null;

      return _symbol + ' ' + fiat + ' ' + config.alternativeIsoCode;
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) return null;
      return val();
    };
  };


  root.processTx = function(tx, network, customRate) {
    if (!tx || tx.action == 'invalid') {
      return tx;
    }

    var CUSTOMNETWORKS = customNetworks.getStatic();

    var networkObj = CUSTOMNETWORKS[network];
    var unitSymbol = networkObj ? networkObj.symbol : "BTC";

    // New transaction output format
    if (tx.outputs && tx.outputs.length) {
      var outputsNr = tx.outputs.length;

      if (tx.action != 'received') {
        if (outputsNr > 1) {
          tx.recipientCount = outputsNr;
          tx.hasMultiplesOutputs = true;
        }
        tx.amount = lodash.reduce(tx.outputs, function(total, o) {
          o.amountStr = root.formatAmountStr(o.amount) + " " + unitSymbol;
          o.alternativeAmountStr = customRate
            ? root.formatFormerAlternativeStr(tx.amount, networkObj, customRate)
            : root.formatAlternativeStr(tx.amount, networkObj);
          return total + o.amount;
        }, 0);
      }
      tx.toAddress = tx.outputs[0].toAddress;
    }

    tx.amountStr = root.formatAmountStr(tx.amount) + " " + unitSymbol;

    tx.alternativeAmountStr = customRate
      ? root.formatFormerAlternativeStr(tx.amount, networkObj, customRate)
      : root.formatAlternativeStr(tx.amount, networkObj);

    tx.feeStr = root.formatAmountStr(tx.fee || tx.fees) + " " + unitSymbol;

    if (tx.amountStr) {
      tx.amountValueStr = tx.amountStr.split(' ')[0];
      tx.amountUnitStr = tx.amountStr.split(' ')[1];
    }

    return tx;
  };

  root.formatPendingTxps = function(txps) {
    $scope.pendingTxProposalsCountForUs = 0;
    var now = Math.floor(Date.now() / 1000);

    /* To test multiple outputs...
    var txp = {
      message: 'test multi-output',
      fee: 1000,
      createdOn: new Date() / 1000,
      outputs: []
    };
    function addOutput(n) {
      txp.outputs.push({
        amount: 600,
        toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
        message: 'output #' + (Number(n) + 1)
      });
    };
    lodash.times(150, addOutput);
    txps.push(txp);
    */

    lodash.each(txps, function(tx) {

      // var walletObj = profileService.getWallet(tx.walletId);

      tx = root.processTx(tx, walletObj.credentials.network);

      // no future transactions...
      if (tx.createdOn > now)
        tx.createdOn = now;

      // tx.wallet = walletObj;
      //
      if (!tx.wallet) {
        $log.error("no wallet at txp?");
        return;
      }

      var action = lodash.find(tx.actions, {
        copayerId: tx.wallet.copayerId
      });

      if (!action && tx.status == 'pending') {
        tx.pendingForUs = true;
      }

      if (action && action.type == 'accept') {
        tx.statusForUs = 'accepted';
      } else if (action && action.type == 'reject') {
        tx.statusForUs = 'rejected';
      } else {
        tx.statusForUs = 'pending';
      }

      if (!tx.deleteLockTime)
        tx.canBeRemoved = true;
    });

    return txps;
  };

  root.parseAmount = function(amount, currency) {
    var config = configService.getSync().wallet.settings;
    var satToBtc = 1 / 100000000;
    var unitToSatoshi = config.unitToSatoshi;
    var amountUnitStr;
    var amountSat;
    var alternativeIsoCode = config.alternativeIsoCode;
    var constUnits = bwcService.getConstants().UNITS
    // If fiat currency
    if (!lodash.indexOf(Object.keys(constUnits), currency) && currency != 'sat') {
      amountUnitStr = $filter('formatFiatAmount')(amount) + ' ' + currency;
      amountSat = rateService.fromFiat(amount, currency).toFixed(0);
    } else if (currency == 'sat') {
      amountSat = amount;
      amountUnitStr = root.formatAmountStr(amountSat);
      // convert sat to BTC
      amount = (amountSat * satToBtc).toFixed(8);
      currency = '';
    } else {
      amountSat = parseInt((amount * unitToSatoshi).toFixed(0));
      amountUnitStr = root.formatAmountStr(amountSat);
      // convert unit to BTC
      amount = (amountSat * satToBtc).toFixed(8);
    }

    return {
      amount: amount,
      currency: currency,
      alternativeIsoCode: alternativeIsoCode,
      amountSat: amountSat,
      amountUnitStr: amountUnitStr
    };
  };

  root.satToUnit = function(amount) {
    var config = configService.getSync().wallet.settings;
    var unitToSatoshi = config.unitToSatoshi;
    var satToUnit = 1 / unitToSatoshi;
    var unitDecimals = config.unitDecimals;
    return parseFloat((amount * satToUnit).toFixed(unitDecimals));
  };

  return root;
});
