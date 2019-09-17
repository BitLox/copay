
(function(angular) {
'use strict';
angular.module('app.util')
.service('customNetworks',
['$q', '$http', 'appConfigService', 'storageService', 'bitcore', '$log',

function Bitlox($q, $http, appConfigService, storageService, bitcore, $log) {

this.customNetworks = {
  livenet: {
    network: 'livenet',
    name: 'livenet',
    alias: 'Bitcoin',
    code: 'btc',
    symbol: 'BTC',
    "ratesUrl": "https://bitpay.com/api/rates",
    derivationCoinPath: '0',
    pubkeyhash: 0x00,
    privatekey: 0x80,
    scripthash: 0x05,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0xf9beb4d9,
    port: 8333,
    bwsUrl: 'https://bws.bitlox.com/bws/api/',
    apiUrl: 'https://bitlox.io/api/',
    explorer: 'https://bitlox.io/',
    dnsSeeds: [
      'seed.bitcoin.sipa.be',
      'dnsseed.bluematt.me',
      'dnsseed.bitcoin.dashjr.org',
      'seed.bitcoinstats.com',
      'seed.bitnodes.io',
      'bitseed.xf2.org'
    ]
  }
}


this.customNetworks.dash = {
  "network": "dash",
  "name": "dash",
  "alias": "Dash",
  "code": "dash",
  "symbol": "DASH",
  "derivationCoinPath": 0,
  "ratesUrl": "https://bws.bitlox.com:8443/rates/dash",
  "pubkeyhash": 0x4C,
  "privatekey": 0xCC,
  "scripthash": 0x10,
  "xpubkey": 0x0488B21E,
  "xprivkey": 0x0488ade4,
  "bwsUrl": "https://bws.dash.dlc.net/bws/api",
  "port": "9999",
  "networkMagic": 0xBF0C6BBD,
  "explorer": "https://explorer.dash.dlc.net/"
}
bitcore.Networks.add(this.customNetworks.dash)


this.customNetworks.litecoin = {
  "network": "litecoin",
  "name": "litecoin",
  "alias": "Litecoin",
  "code": "ltc",
  "symbol": "LTC",
  "derivationCoinPath": 0,
  "ratesUrl": "https://bws.bitlox.com:8443/rates/litecoin",
  "pubkeyhash": 0x30,
  "privatekey": 0xb0,
  "scripthash": 0x32,
  "xpubkey": 0x019da462,
  "xprivkey": 0x019d9cfe,
  "networkMagic": 0xfbc0b6db,
  "bwsUrl": "https://bws.ltc.dlc.net/bws/api",
  "port": "9333",
  "explorer": "https://explorer.ltc.dlc.net/"
}
bitcore.Networks.add(this.customNetworks.litecoin)

this.getStatic = function() {
  return this.customNetworks;
}
this.getAll = function() {
  var resourcePromise = $q.defer();
                  // storageService.setCustomNetworks("{}");
  var self = this
  storageService.getCustomNetworks(function(err, networkListRaw) {
    if(err) {
      // $log.log('storage service error while retrieving custom networks', err, JSON.stringify(err))
      resourcePromise.reject()
    }
    if(networkListRaw) {
      // $log.log('networkListRaw',networkListRaw)
      var networkList = JSON.parse(networkListRaw)
      for (var n in networkList) {
        self.customNetworks[networkList[n].name] = networkList[n]
        if(!bitcore.Networks.get(networkList[n].name)) {
          bitcore.Networks.add(networkList[n])
        }
      }
    } else {
      // $log.warn("NO NETWORK LIST RAW", networkListRaw)
    }
    // $log.warn(self.customNetworks)
    resourcePromise.resolve(self.customNetworks)
  })

  return resourcePromise.promise
}
this.getCustomNetwork = function(customParam) {
  var def = $q.defer();
  var self = this
  if(customParam) {
    var networkName = customParam
    this.getAll().then(function(CUSTOMNETWORKS) {
      // check apple approved list on iOS, and the full list of whatever we can support for Android
      var customNet = CUSTOMNETWORKS[customParam]
      if(customNet) {
        // $log.log('found in local cache')
        def.resolve(customNet)
      } else {
        storageService.getCustomNetworks(function(err, customNetworkListRaw) {
          var customNetworkList = {}
          if(customNetworkListRaw) {
            customNetworkList = JSON.parse(customNetworkListRaw)
          }
          customNetworkList[customParam] = res;
          storageService.setCustomNetworks(JSON.stringify(customNetworkList));
          if(!bitcore.Networks.get(res.name)) { bitcore.Networks.add(res) }
          def.resolve(res)
        })
        // try getting it from bitlox website
        // $http.get("https://btm.bitlox.com/coin/"+networkName+".php").then(function(response){
        //   // $log.log('got network from server', response)
        //   if(!response) {
        //     // $log.log('no response from server')
        //     def.reject();
        //   }
        //   var res = response.data;
        //   res.pubkeyhash = parseInt(res.pubkeyhash,16)
        //   res.privatekey = parseInt(res.privatekey,16)
        //   res.scripthash = parseInt(res.scripthash,16)
        //   res.xpubkey = parseInt(res.xpubkey,16)
        //   res.xprivkey = parseInt(res.xprivkey,16)
        //   res.networkMagic = parseInt(res.networkMagic,16)
        //   res.port = parseInt(res.port, 10)
        //   $log.log('parsed network from server', res)
        //   self.customNetworks[customParam] = res;
        //   storageService.getCustomNetworks(function(err, customNetworkListRaw) {
        //     var customNetworkList = {}
        //     if(customNetworkListRaw) {
        //       customNetworkList = JSON.parse(customNetworkListRaw)
        //     }
        //     customNetworkList[customParam] = res;
        //     storageService.setCustomNetworks(JSON.stringify(customNetworkList));
        //     if(!bitcore.Networks.get(res.name)) { bitcore.Networks.add(res) }
        //     def.resolve(res)
        //   })
        // }, function(err) {
        //   // $log.warn('server network error', err)
        //   def.reject();
        // })
      }
    })
  } else {
    return $q.resolve();
  }
  return def.promise;
}


}])})(window.angular);
