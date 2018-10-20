'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $http, $timeout, $scope, $state, $stateParams, $ionicModal, $ionicScrollDelegate, $window, gettextCatalog, lodash, popupService, ongoingProcess, externalLinkService, latestReleaseService, profileService, walletService, configService, $log, platformInfo, storageService, txpModalService, appConfigService, startupService, addressbookService, feedbackService, bwcError, nextStepsService, buyAndSellService, homeIntegrationsService, bitpayCardService, pushNotificationsService, timeService, bitcore, customNetworks, txFormatService, $q, $ionicLoading, rateService) {

    var wallet;
    var listeners = [];
    var notifications = [];

    $scope.externalServices = {};
    $scope.openTxpModal = txpModalService.open;
    $scope.version = $window.version;
    $scope.name = appConfigService.nameCase;
    $scope.homeTip = $stateParams.fromOnboarding;
    $scope.isCordova = platformInfo.isCordova;
    $scope.isAndroid = platformInfo.isAndroid;
    $scope.isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;
    $scope.isNW = platformInfo.isNW;
    $scope.showRateCard = {};
    $scope.defaults = {};
    $scope.showReorder = false;

    $scope.$on("$ionicView.afterEnter", function() {
      startupService.ready();
    });

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      if (!$scope.homeTip) {
        storageService.getHomeTipAccepted(function(error, value) {
          $scope.homeTip = (value == 'accepted') ? false : true;
        });
      }

      if ($scope.isNW) {
        latestReleaseService.checkLatestRelease(function(err, newRelease) {
          if (err) {
            $log.warn(err);
            return;
          }
          if (newRelease) {
            $scope.newRelease = true;
            $scope.updateText = gettextCatalog.getString('There is a new version of {{appName}} available', {
              appName: $scope.name
            });
          }
        });
      }

      $scope.defaults = configService.getDefaults();
      $scope.wallets = profileService.getWallets();
      $scope.usedNetworks = $scope.wallets.map(function(wallet) {
        return wallet.network;
      }).filter(function(value, index, self) {
        return self.indexOf(value) === index;
      });

      $scope.setRates();

      profileService.getOrderedWallets(function(orderedWallets) {
        $scope.orderedWallets = orderedWallets;
      });

      storageService.getFeedbackInfo(function(error, info) {

        if ($scope.isWindowsPhoneApp) {
          $scope.showRateCard.value = false;
          return;
        }
        if (!info) {
          initFeedBackInfo();
        } else {
          var feedbackInfo = JSON.parse(info);
          //Check if current version is greater than saved version
          var currentVersion = $scope.version;
          var savedVersion = feedbackInfo.version;
          var isVersionUpdated = feedbackService.isVersionUpdated(currentVersion, savedVersion);
          if (!isVersionUpdated) {
            initFeedBackInfo();
            return;
          }
          var now = moment().unix();
          var timeExceeded = (now - feedbackInfo.time) >= 24 * 7 * 60 * 60;
          $scope.showRateCard.value = timeExceeded && !feedbackInfo.sent;
          $timeout(function() {
            $scope.$apply();
          });
        }

      });

      function initFeedBackInfo() {
        var feedbackInfo = {};
        feedbackInfo.time = moment().unix();
        feedbackInfo.version = $scope.version;
        feedbackInfo.sent = false;
        storageService.setFeedbackInfo(JSON.stringify(feedbackInfo), function() {
          $scope.showRateCard.value = false;
        });
      };
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      
      var config = configService.getSync();
      updateAllWallets();

      addressbookService.list(function(err, ab) {
        if (err) $log.error(err);
        $scope.addressbook = ab || {};
      });

      $scope.hasAursWallet = false;
      $scope.hasBitcoinWallet = false;
      $scope.isLinked = false;
      $scope.isBtcLinked = false;
      $scope.isAursLinked = false;
      $scope.isVerified = false;
      $scope.uploadedVerification = config.wallet.uploadedVerification
      $scope.linkedAursWallet = null;
      $scope.linkedBtcWallet = null;
      $scope.linkedAursWalletId = null;
      $scope.linkedBtcWalletid = null;      
      for(var i in $scope.wallets) {
        if($scope.wallets[i].credentials) { 
          var thisxpub = lodash.pluck($scope.wallets[i].credentials.publicKeyRing, 'xPubKey').pop()
          if($scope.wallets[i].network === 'livenet') {
            $scope.hasBitcoinWallet = true;
            if(thisxpub === config.wallet.linkedBtcWallet) {
              $scope.isBtcLinked = true;
              $scope.linkedBtcWalletId = $scope.wallets[i].id
              $scope.linkedBtcWallet = thisxpub
            }
          }
          if($scope.wallets[i].network === 'aureus') {
            // $log.warn($scope.wallets[i].credentials.publicKeyRing)
            $scope.hasAursWallet = true
            if(thisxpub === config.wallet.linkedAursWallet) {
              $scope.isAursLinked = true;
              $scope.linkedAursWalletId = $scope.wallets[i].id
              $scope.linkedAursWallet = thisxpub
            }          
          }
        }
      }
      if($scope.isAursLinked && $scope.isBtcLinked) { $scope.isLinked = true; }
      
      if($scope.hasAursWallet) {
        var deviceId = null;
        try {
              deviceId = device.uuid
        } catch(e) {

        }

        $log.warn("is  link :" + $scope.isLinked)
        var URL = 'https://seed.aureus.live/api/verification/status/'+deviceId
        $http({
          method: 'GET',
          url: URL
        }).then(function(result) {
          if(!result.data) {
            $scope.uploadedVerification = false;
            $scope.isLinked = false;
            $scope.isBtcLinked = false;
            $scope.isAursLinked = false;
            $scope.isVerified = false;
            $scope.linkedAursWallet = null;
            $scope.linkedBtcWallet = null;
            $scope.linkedAursWalletId = null;
            $scope.linkedBtcWalletid = null; 
            return;    
          }
          $scope.isVerified = result.data.isVerified      
          $scope.noteMisc = result.data.noteMisc   
          $scope.noteDividend = result.data.noteDividend 
          if(result.data.aursWalletXpub !== $scope.linkedAursWallet) {
            $log.warn("AURS Wallet not linked after render from server")
            $scope.isAursLinked = false
            $scope.isLinked = false;
          }
          if(result.data.btcWalletXpub !== $scope.linkedBtcWallet) {
            $log.warn("BTC Wallet not linked after render from server")
            $scope.isBtcLinked = false
            $scope.isLinked = false;
          }
          if($scope.isVerified) {
            var opts = {
              wallet: {
                isVerified: true
              }
            };
            configService.set(opts, function(err) {
              if (err) $log.debug(err);
            });     
          }
        }, function(err) {
        });        
      }

      listeners = [
        $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
          var wallet = profileService.getWallet(walletId);
          updateWallet(wallet);
          if ($scope.recentTransactionsEnabled) getNotifications();

        }),
        $rootScope.$on('Local/TxAction', function(e, walletId) {
          $log.debug('Got action for wallet ' + walletId);
          var wallet = profileService.getWallet(walletId);
          updateWallet(wallet);
          if ($scope.recentTransactionsEnabled) getNotifications();
        })
      ];


      $scope.buyAndSellItems = buyAndSellService.getLinked();
      $scope.homeIntegrations = homeIntegrationsService.get();

      bitpayCardService.get({}, function(err, cards) {
        $scope.bitpayCardItems = cards;
      });

      configService.whenAvailable(function(config) {
        $scope.recentTransactionsEnabled = config.recentTransactions.enabled;
        if ($scope.recentTransactionsEnabled) getNotifications();

        if (config.hideNextSteps.enabled) {
          $scope.nextStepsItems = null;
        } else {
          $scope.nextStepsItems = nextStepsService.get();
        }

        $scope.showBitLoxBuyLink = config.showBitLoxBuyLink;

        pushNotificationsService.init();

        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      });
    });

    $scope.$on("$ionicView.leave", function(event, data) {
      lodash.each(listeners, function(x) {
        x();
      });
    });

    $scope.setRates = function(opts) {
      if (!opts) {
        opts = {};
      }

      var unitToSatoshi = $scope.defaults.wallet.settings.unitToSatoshi;

      if (opts.showLoading) {
        $ionicLoading.show({
          duration: 1800,
          template: '<ion-spinner></ion-spinner> <br/> Fetching rates...'
        });
      }

      var _networks = Object.keys(customNetworks.getStatic()).filter(function(networkName) {
        return $scope.usedNetworks.indexOf(networkName) !== -1;
      }).reduce(function(networkList, networkName) {
        var network = {};
        network[networkName] = customNetworks.getStatic()[networkName];
        return Object.assign(networkList, network);
      }, {});


      var fetchNetworks = lodash.map(_networks, function(network) {
        var deferred = $q.defer();

        rateService._fetchCurrencies($scope.usedNetworks, function() {
          txFormatService.formatAlternativeStr(1 * unitToSatoshi, network, function(altStr) {
            deferred.resolve({
              symbol: network.symbol,
              altStr: altStr,
              network: network.name
            });
          });
        });

        return deferred.promise;
      });

      $q.all(fetchNetworks).then(function(rates) {
        $scope.rates = rates;
      });
    };

    $scope.createdWithinPastDay = function(time) {
      return timeService.withinPastDay(time);
    };

    $scope.openExternalLink = function() {
      var url = 'https://github.com/bitpay/copay/releases/latest';
      var optIn = true;
      var title = gettextCatalog.getString('Update Available');
      var message = gettextCatalog.getString('An update to this app is available. For your security, please update to the latest version.');
      var okText = gettextCatalog.getString('View Update');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };

    $scope.openNotificationModal = function(n) {
      wallet = profileService.getWallet(n.walletId);

      if (n.txid) {
        $state.transitionTo('tabs.wallet.tx-details', {
          txid: n.txid,
          walletId: n.walletId
        });
      } else {
        var txp = lodash.find($scope.txps, {
          id: n.txpId
        });
        if (txp) {
          txpModalService.open(txp);
        } else {
          ongoingProcess.set('loadingTxInfo', true);
          walletService.getTxp(wallet, n.txpId, function(err, txp) {
            var _txp = txp;
            ongoingProcess.set('loadingTxInfo', false);
            if (err) {
              $log.warn('No txp found');
              return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Transaction not found'));
            }
            txpModalService.open(_txp);
          });
        }
      }
    };

    $scope.openWallet = function(wallet) {
      if (!wallet.isComplete()) {
        return $state.go('tabs.copayers', {
          walletId: wallet.credentials.walletId
        });
      }

      $state.go('tabs.wallet', {
        walletId: wallet.credentials.walletId
      });
    };

    $scope.reorderWallet = function(wallet, fromIndex, toIndex) {
      $scope.orderedWallets.splice(fromIndex, 1);
      $scope.orderedWallets.splice(toIndex, 0, wallet);

      var orderedWallets = $scope.orderedWallets.map(function(wallet) {
        return wallet.name;
      });

      storageService.setOrderedWallet(JSON.stringify(orderedWallets), function () {});
      $scope.toggleReorder();
    };

    $scope.toggleReorder = function() {
      if ($scope.wallets.length > 1) {
        $scope.showReorder = !$scope.showReorder;
      }
    };

    $scope.closeReorder = function() {
      $scope.showReorder = false;
    };

    $scope.doneOrAdd = function () {
      if ($scope.showReorder) {
        $scope.closeReorder();
      } else {
        $state.go('tabs.add');
      }
    };

    var updateTxps = function() {
      profileService.getTxps({
        limit: 3
      }, function(err, txps, n) {
        if (err) $log.error(err);
        $scope.txps = txps;
        $scope.txpsN = n;
        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      })
    };

    var updateAllWallets = function() {

        if (lodash.isEmpty($scope.wallets)) return;

        var i = $scope.wallets.length;
        var j = 0;
        var timeSpan = 60 * 60 * 24 * 7;

        lodash.each($scope.wallets, function(wallet) {
          walletService.getStatus(wallet, {}, function(err, status) {
            if (err) {

              wallet.error = (err === 'WALLET_NOT_REGISTERED') ? gettextCatalog.getString('Wallet not registered') : bwcError.msg(err);

              $log.error(err);
            } else {
              wallet.error = null;
              wallet.status = status;

              // TODO service refactor? not in profile service
              profileService.setLastKnownBalance(wallet.id, wallet.status.totalBalanceStr, function() {});
            }
            if (++j == i) {
              updateTxps();
            }
          });
        });
    };

    var updateWallet = function(wallet) {
      $log.debug('Updating wallet:' + wallet.name)
      walletService.getStatus(wallet, {}, function(err, status) {
        if (err) {
          $log.error(err);
          return;
        }
        wallet.status = status;
        updateTxps();
      });
    };

    var getNotifications = function() {
      profileService.getNotifications({
        limit: 3
      }, function(err, notifications, total) {
        if (err) {
          $log.error(err);
          return;
        }

        $scope.notifications = notifications;
        $scope.notificationsN = total;
        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      });
    };

    $scope.hideHomeTip = function() {
      storageService.setHomeTipAccepted('accepted', function() {
        $scope.homeTip = false;
        $timeout(function() {
          $scope.$apply();
        })
      });
    };
    $scope.openLink = function(url) {
      if(!url) { return; }
      var optIn = true;
      var title = gettextCatalog.getString('External Link');
      var message = gettextCatalog.getString('Do you want to visit this external link?');
      var okText = gettextCatalog.getString('Yes');
      var cancelText = gettextCatalog.getString('Cancel');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    }

    $scope.openBitlox = function() {
      var url = 'https://bitlox.com';
      var optIn = true;
      var title = gettextCatalog.getString('BitLox');
      var message = gettextCatalog.getString('Do you want to visit BitLox.com?');
      var okText = gettextCatalog.getString('Yes');
      var cancelText = gettextCatalog.getString('Cancel');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    }

    $scope.onRefresh = function() {
      $timeout(function() {
        $scope.$broadcast('scroll.refreshComplete');
      }, 300);
      updateAllWallets();
    };
  });
