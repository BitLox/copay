'use strict';

/*
 * This class lets interfaces with BitPay's exchange rate API.
 */

var RateService = function(opts) {
  var self = this;

  opts = opts || {};
  self.httprequest = opts.httprequest;
  self.lodash = opts.lodash;
  self.customNetworks = opts.customNetworks;
  self.defaults = opts.defaults;

  self.SAT_TO_BTC = 1 / 1e8;
  self.BTC_TO_SAT = 1e8;
  self.UNAVAILABLE_ERROR = 'Service is not available - check for service.isAvailable() or use service.whenAvailable()';
  self.UNSUPPORTED_CURRENCY_ERROR = 'Currency not supported';

  self._isAvailable = false;
  self._rates = {};
  self._alternatives = {};
  self.networks = {};
  self._queued = [];

  self._fetchCurrencies();
};


var _instance;
RateService.singleton = function(opts) {
  if (!_instance) {
    _instance = new RateService(opts);
  }
  return _instance;
};

RateService.prototype._fetchCurrencies = function(networks, fetchCallback) {
  var self = this;

  var backoffSeconds = 10;
  var updateFrequencySeconds = 5 * 60;

  // if (!networks) {
  //   return;
  // }

  retrieve();

  function retrieve() {
    self.customNetworks.getAll().then(function(CUSTOMNETWORKS) {
      if(networks) {
        networks.forEach(function(n) {
         self.networks[CUSTOMNETWORKS[n].name] = CUSTOMNETWORKS[n];
        });
      } else {
        self.networks = CUSTOMNETWORKS
      }
      for (var i in self.networks) {
        if(!self._rates[self.networks[i].name]) {
          self._rates[self.networks[i].name] = []
          self._alternatives[self.networks[i].name] = []
        }
      }
      var length = Object.keys(self.networks).length;
      var done = 0;
      for(var i in self.networks) {
        retrieveOne(self.networks[i], function(err) {
          done++;
          if(err) {
            setTimeout(function() {
              backoffSeconds *= 1.2;
              retrieve();
            }, backoffSeconds * 1000);

          }
          // even if there are errors, if we have done all the calls, we want to return what we do have 
          if(done === length) {
            self._isAvailable = true;
            self.lodash.each(self._queued, function(callback) {
              setTimeout(callback, 1);
            });
            setTimeout(retrieve, updateFrequencySeconds * 1000);      
            if(fetchCallback) fetchCallback();    
          }
        })
      }
    })
  }

  function retrieveOne(network, cb) {
    self.httprequest.get(network.ratesUrl).success(function(res) {
      self.lodash.each(res, function(currency) {
        self._rates[network.name][currency.code] = currency.rate;
        self._alternatives[network.name].push({
          name: currency.name,
          isoCode: currency.code,
          rate: currency.rate
        });
      });
      cb()
    }).error(function() {
      return cb(new Error("error retrieving at least one rate table"))
    });
  }
};

RateService.prototype.getRate = function(code, network) {
  if(!network) {
    network = this.networks['livenet']
  }

  if(!this._rates[network.name]) {
    return console.error("rate service unavailable as yet.", network.name);
  }
  return this._rates[network.name][code];
};

RateService.prototype.getAlternatives = function(network) {
  if(!network) {
    network = this.networks['livenet']
  }  
  if(!this._alternatives[network.name]) {
    return console.error("rate service unavailable as yet.", network.name);
  }
  return this._alternatives[network.name];
};

RateService.prototype.isAvailable = function() {
  return this._isAvailable;
};

RateService.prototype.whenAvailable = function(callback) {
  if (this.isAvailable()) {
    setTimeout(callback, 1);
  } else {
    this._queued.push(callback);
  }
};

RateService.prototype.toFiat = function(satoshis, code, network, rate) {
  if (!this.isAvailable()) {
    return null;
  }

  rate = rate != null ? rate : this.getRate(code, network);

  return satoshis * this.SAT_TO_BTC * rate;
};

RateService.prototype.fromFiat = function(amount, code, network) {
  if (!this.isAvailable()) {
    return null;
  }
  return amount / this.getRate(code, network) * this.BTC_TO_SAT;
};

RateService.prototype.listAlternatives = function(sort, network) {
  var self = this;
  if (!this.isAvailable()) {
    return [];
  }

  var alternatives = self.lodash.map(this.getAlternatives(network), function(item) {
    return {
      name: item.name,
      isoCode: item.isoCode
    }
  });
  if (sort) {
    alternatives.sort(function(a, b) {
      return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
    });
  }
  return self.lodash.uniq(alternatives, 'isoCode');
};

angular
  .module('copayApp.services')
  .factory('rateService', function($http, lodash, configService, customNetworks) {
    var defaults = configService.getDefaults();

    var cfg = {
      httprequest: $http,
      lodash: lodash,
      customNetworks: customNetworks,
      defaults: defaults,
    };

    return RateService.singleton(cfg);    
  });
