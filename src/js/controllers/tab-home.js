'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, $state, $stateParams, $ionicModal, $ionicScrollDelegate, $window, gettextCatalog, lodash, popupService, ongoingProcess, externalLinkService, latestReleaseService, profileService, walletService, configService, $log, platformInfo, storageService, txpModalService, appConfigService, startupService, addressbookService, feedbackService, bwcError, nextStepsService, buyAndSellService, homeIntegrationsService, bitpayCardService, pushNotificationsService, timeService, bitcore, customNetworks) {

    var wallet;
    var listeners = [];
    var notifications = [];
    var orderedWallets = [];

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

      storageService.getOrderedWallet(function(error, _orderedWallets) {
        var wallets = profileService.getWallets();

        orderedWallets = _orderedWallets
                       ? JSON.parse(_orderedWallets)
                       : createOrderedWallets(wallets);

        lodash.forEach(orderedWallets, function(wallet, index) {
          var walletIndex = lodash.findIndex(wallets, function(o) {
            return o.name === wallet;
          });

          wallets.splice(index, 0, wallets.splice(walletIndex, 1)[0]);
        });

        $scope.wallets = wallets;
      });

      $scope.defaults = configService.getDefaults();
      customNetworks.getAll().then(function(CUSTOMNETWORKS) {
        // console.log('custom networks', CUSTOMNETWORKS)
        configService.get(function(err, config) {
          var defaultNetwork = lodash.clone(config.defaultNetwork)
          defaultNetwork.pubkeyhash = parseInt(defaultNetwork.pubkeyhash,16)
          defaultNetwork.privatekey = parseInt(defaultNetwork.privatekey,16)
          defaultNetwork.scripthash = parseInt(defaultNetwork.scripthash,16)
          defaultNetwork.xpubkey = parseInt(defaultNetwork.xpubkey,16)
          defaultNetwork.xprivkey = parseInt(defaultNetwork.xprivkey,16)
          defaultNetwork.networkMagic = parseInt(defaultNetwork.networkMagic,16)
          if(!bitcore.Networks.get(defaultNetwork.name)) {
            bitcore.Networks.add(defaultNetwork)
            // console.log('added default network', bitcore.Networks.get(defaultNetwork.name))
          }
          var walletNetworks = {};

          for(var i=0;i<$scope.wallets.length;i++) {
            if(!$scope.wallets[i].network) { $scope.wallets[i].network = 'livenet'; } // for legacy bitlox wallets
            walletNetworks[$scope.wallets[i].network] = $scope.wallets[i].network
          }
          for(var x in walletNetworks) {
            if(!bitcore.Networks.get(walletNetworks[x])) {
              // console.log('adding network', walletNetworks[x])
              customNetworks.getCustomNetwork(walletNetworks[x]).then(function(fetchedNetwork) {
                if(!bitcore.Networks.get(fetchedNetwork.name)) {
                  bitcore.Networks.add(fetchedNetwork)
                }
              }).catch(function(err) {
                console.warn("could not get network " + walletNetworks[i])
              });
            }
          }
        });
      })
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
      updateAllWallets();

      addressbookService.list(function(err, ab) {
        if (err) $log.error(err);
        $scope.addressbook = ab || {};
      });

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
      $scope.wallets.splice(fromIndex, 1);
      $scope.wallets.splice(toIndex, 0, wallet);

      orderedWallets = createOrderedWallets($scope.wallets);

      storageService.setOrderedWallet(JSON.stringify(orderedWallets), function () {});
    };

    $scope.toggleReorder = function() {
      $scope.showReorder = !$scope.showReorder;
    };

    function createOrderedWallets(wallets) {
      return wallets.map(function(wallet) {
        return wallet.name;
      });
    }

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
