(function(window, angular, chrome) {
    'use strict';

    angular.module('app.wallet')
        .controller('WalletCtrl', WalletCtrl);

    WalletCtrl.$inject = ['$scope', '$rootScope', '$log', '$state', '$stateParams', '$timeout', '$ionicPopup', '$ionicModal', '$ionicLoading', 'MAX_WALLETS', 'bitloxWallet', 'Toast', 'bitloxHidChrome', 'bitloxHidWeb', 'bitloxBleApi', '$ionicHistory', 'profileService',  'ongoingProcess', 'walletService', 'popupService', 'gettextCatalog', 'derivationPathHelper', 'bwcService', 'platformInfo', 'configService', 'externalLinkService', 'BIP39WordList'];

    function WalletCtrl($scope, $rootScope,  $log, $state, $stateParams, $timeout, $ionicPopup, $ionicModal, $ionicLoading, MAX_WALLETS, bitloxWallet, Toast, hidchrome, hidweb, bleapi, $ionicHistory, profileService, ongoingProcess, walletService, popupService, gettextCatalog, derivationPathHelper, bwcService, platformInfo, configService, externalLinkService, BIP39WordList) {
        $scope.showBitLoxBuyLink = configService.getSync().showBitLoxBuyLink;

        var api = hidweb;
        if (platformInfo.isChromeApp) {
          api = hidchrome;
        } else if(platformInfo.isMobile) {
          api = bleapi;
          api.initializeBle();
        }

        $scope.api = api;

        $scope.openBitlox = function() {
          var url = 'https://bitlox.com';
          var optIn = true;
          var title = gettextCatalog.getString('BitLox');
          var message = gettextCatalog.getString('Do you want to visit BitLox.com?');
          var okText = gettextCatalog.getString('Yes');
          var cancelText = gettextCatalog.getString('Cancel');
          externalLinkService.open(url, optIn, title, message, okText, cancelText);
        }

        $scope.bitlox = {
          isMobile: platformInfo.isMobile,
          connectAttempted: false,
          connected: false,
          statusString: "No Bitlox",
          alertClass: "danger"
        }

        $scope.wallet = {
          status: null,
          alertClass: "warning"
        };

        $scope.getEntropy = function(data) {
          api.getEntropy(1024).then(function(data) {

            $log.warn("ENTROPY SUCCESS "+data.payload.entropy)
          }).catch(function(e) {
            $log.warn("ENTROPY FAILURE")
            $log.warn(e)
          });
        }

        $scope.ping = function(data) {
          api.ping({greeting:"wbalbadubs"}).then(function(data) {
            $log.warn("PING SUCCESS "+data.payload.echoed_greeting + " " + data.payload.echoed_session_id)
          }).catch(function(e) {
            $log.warn("PING FAILURE")
            $log.warn(e)
          });
        }

        $scope.refreshBitlox = function($event) {
          if(platformInfo.isMobile) {
            if (platformInfo.isIOS && window.cordova.plugins.diagnostic) {
              window.cordova.plugins.diagnostic.isBluetoothAvailable(function(available) {
                if (!available) {
                  $ionicLoading.show({ template: "Turn on Bluetooth to connect to BitLox", duration: 2000 })
                }
              });
            }

            api.startScanNew();
            $timeout(function() {
              api.stopScan();
            }, 60000)
          }
        }

        $scope.connectBle = function(address) {
          $ionicLoading.show({
            template: 'Connecting to BitLox, Please Wait...'
          });
          // $log.debug('connecting to '+address)

          api.connect(address).then(function() {
          }, function(err) {
            $log.debug("BitLox Connection Error", err)
            api.disconnect();
          }).finally(function() {

          })
        }

        $scope.createWallet = function() {
            if($scope.newWallet.isRestore && $scope.BIP39Words.length < 1) {
              return $scope.showMnemonicModal()
            }
            if($scope.newWallet.isRestore) {
              $ionicLoading.show({ template: "Restoring..." });
            } else {
              $ionicLoading.show({ template: "Creating Wallet, Check Your BitLox" });
            }
            $scope.creatingWallet = true;

            bitloxWallet.create($scope.newWallet.number, $scope.newWallet).then(function(res) {
              $ionicLoading.hide();
              if(res.type === api.TYPE_ERROR) {
                popupService.showAlert(gettextCatalog.getString('Error'));
                return false;
              }
              $scope.resetNewWallet()
              $ionicHistory.goBack(-1)
            }, function(err) {
              popupService.showAlert(gettextCatalog.getString('Error'), err);
              $ionicLoading.hide()
            }).finally(function(res) {
                // reset();
                $scope.creatingWallet = false;
                $scope.newWallet.isRestore = false;
            });
        };

        $scope.updateWordNumbers = function() {
            if (!$scope.userWords) {
                return;
            }
            var words = $scope.userWords.split(/\s+/);
            var numbers = [];
            for (var i = 0; i < words.length; i++) {
                var word = words[i];
                var wordIndex = BIP39WordList.indexOf(word);
                if (wordIndex < 0) {
                    numbers[i] = "INVALID WORD";
                } else {
                    numbers[i] = wordIndex;
                }
            }
            $scope.wordIndexes = numbers;
        };

        $scope.resetNewWallet = function() {
            $scope.newWallet = {
                name: "Wallet",
                number: 0,
                isSecure: true,
                isHidden: false,
                isRestore: false,
            };
        }

        $scope.resetNewWallet();

        // dave says this comes from the import.js file by copay, with edits
        var _importExtendedPublicKey = function(wallet, cb) {
          $ionicLoading.show({
            template: 'Importing BitLox wallet...'
          });
          api.getDeviceUUID().then(function(result) {
            var opts = {};

            opts.singleAddress = false
            opts.externalSource = 'bitlox/'+wallet.number
            opts.isPrivKeyExternal = true
            opts.extendedPublicKey = wallet.xpub
            opts.derivationPath = derivationPathHelper.getDefault('livenet')
            opts.derivationStrategy = 'BIP44'
            opts.hasPassphrase = false;
            opts.name = wallet.name;
            opts.account = 0;

            opts.hwInfo = wallet.number

// hardware wallet CHANGE
            var b = bwcService.getBitcore();
            var x = b.HDPublicKey(wallet.xpub);
            opts.entropySource = x.publicKey.toString(); //"40c13cfdbafeccc47b4685d6e7f6a27c";
            // opts.account = wallet.number;
            opts.networkName = 'livenet';
            opts.m = 1;
            opts.n = 1;
            opts.singleAddress = false;

            opts.network = 'livenet'
            opts.bwsurl = 'https://bws.bitlox.com/bws/api'
            opts.apiurl = 'https://bitlox.io/api'

            $log.debug("START IMPORTING")
            profileService.createWallet(opts, function(err, walletId) {
              // $log.debug("DONE IMPORTING")
              if (err) {
                $log.log("create wallet error, trying import", err)


                profileService.importExtendedPublicKey(opts, function(err2, walletId) {
                  $log.warn("DONE IMPORTING")
                  if (err2) {
                    popupService.showAlert(gettextCatalog.getString('Error'), err2);
                    $ionicLoading.hide();
                    return;
                  }
                  $timeout(function() {
                    walletService.updateRemotePreferences(walletId, {network: opts.network});
                    walletService.startScan(walletId);
                    $timeout(function() {
                      $scope.updateDeviceQr(walletId, function() {
                        $ionicLoading.hide()
                        $ionicHistory.goBack(-3);
                      })
                    },5000)
                  },5000);

                });
                return;
              } else {
                $timeout(function() {
                  walletService.updateRemotePreferences(walletId, {network: opts.network});
                  walletService.startScan(walletId);
                  $timeout(function() {
                    $scope.updateDeviceQr(walletId, function() {
                      $ionicLoading.hide()
                      $ionicHistory.goBack(-3);
                    })
                  },5000)
                },5000);
              }
            });
          }).catch(function(e) {
            $log.debug("error getting device UUID", e)
          });

        };

        $scope.updateDeviceQr = function(walletId, cb) {
          walletService.getMainAddresses(walletId, {reverse:true}, function(err, addresses) {
            return cb();
            // if(addresses.length > 0) {
            //   var sp = addresses[0].path.split('/')
            //   var p = parseInt(sp.pop(),10);

            //   api.setQrCode(p+1);
            // }
            // cb();
          });
        }

        $scope.$watch('api.getBleReady()', function(newVal) {
          if(newVal) {
            $scope.refreshBitlox();
          }
        });

        $scope.$watch('api.getStatus()', function(hidstatus) {
          $log.debug("New device status: " + hidstatus)
          switch(hidstatus) {
              case api.STATUS_CONNECTED:
                  $scope.bitlox.connectAttempted = true;
                  $scope.bitlox.connected = true;
                  $scope.bitlox.statusString = "Bitlox connected";
                  $scope.bitlox.alertClass = "success";
                  $scope.bitlox.glyph = "glyphicon-ok";

                    $rootScope.$broadcast('bitloxConnectSuccess')
                    // only read wallets if we are on the add bitlox screen
                    if($state.current.url === '/attach-bitlox') {
                        $scope.readWallets();
                    }
                  break;
              case api.STATUS_IDLE:
                  $scope.bitlox.connectAttempted = true;
                  $scope.bitlox.connected = true;
                  $scope.bitlox.statusString = "Bitlox idle";
                  $scope.bitlox.alertClass = "success";
                  $scope.bitlox.glyph = "glyphicon-ok";
                  break;
              case api.STATUS_CONNECTING:
                  $scope.bitlox.connectAttempted = true;
                  $scope.bitlox.connected = false;
                  $scope.bitlox.statusString = "Bitlox connecting";
                  $scope.bitlox.alertClass = "success";
                  $scope.bitlox.glyph = "glyphicon-refresh";
                  break;
              case api.STATUS_INITIALIZING:
                  $scope.bitlox.connectAttempted = true;
                  $scope.bitlox.connected = false;
                  $scope.bitlox.statusString = "Bitlox initializing";
                  $scope.bitlox.alertClass = "success";
                  $scope.bitlox.glyph = "glyphicon-refresh";
                    $scope.initializeDevice();
                  break;
              case api.STATUS_DISCONNECTED:
                  $scope.bitlox.statusString = "Bitlox disconnected!";
                  $scope.bitlox.alertClass = "danger";
                  $scope.bitlox.glyph = "glyphicon-remove";
                  $scope.bitlox.connected = false;

                  if($scope.wallet.status && $scope.wallet.status !== api.STATUS_DISCONNECTED) {
                    $log.debug("disconnected error")
                    $scope.wallet.status = hidstatus;
                    if($scope.timer) {
                        $ionicLoading.hide();
                        if($state.current.url === '/create-bitlox') {
                            $ionicHistory.goBack();
                        }
                        if ($state.current.url === '/attach-bitlox') {
                            popupService.showAlert(
                              gettextCatalog.getString('Error'),
                              gettextCatalog.getString('BitLox Connection Error')
                            );
                        }
                    }
                  }
                  break;
              case api.STATUS_WRITING:
                  $scope.bitlox.connectAttempted = true;
                  // $scope.bitlox.connected = true;
                  $scope.bitlox.statusString = "Bitlox writing";
                  $scope.bitlox.alertClass = "info";
                  $scope.bitlox.glyph = "glyphicon-upload";
                  break;
              case api.STATUS_READING:
                  $scope.bitlox.connectAttempted = true;
                  // $scope.bitlox.connected = true;
                  $scope.bitlox.statusString = "Bitlox reading";
                  $scope.bitlox.alertClass = "info";
                  $scope.bitlox.glyph = "glyphicon-download";
                  break;
              default:
                  $scope.bitlox.connected = false;
                  $scope.bitlox.statusString = null;
          }

          $scope.wallet.status = hidstatus;

        })

        $scope.readWallets = function() {
            $ionicLoading.show({ template: "Reading BitLox wallet list, please wait..." });
            $scope.readingWallets = true;

            return bitloxWallet.list().then(function(wallets) {
                $scope.wallets = wallets;
                $scope.openWallet = null;
                $scope.refreshAvailableNumbers(wallets);
            }, Toast.errorHandler).finally(function() {
                $ionicLoading.hide();
                $scope.readingWallets = false;
            });
        };

        $scope.loadWallet = function(wallet) {
          $ionicPopup.confirm({
            title: "Link BitLox Wallet #" + wallet.number,
            subTitle: wallet.name,
            cancelText: "Cancel",
            cancelType: 'button-clear button-positive',
            okText: "Yes, Link",
            okType: 'button-clear button-positive'
          }).then(function(res) {
            if(!res) return false;

            $scope.openWallet = null;
            $scope.loadingXpub = true;
            $ionicLoading.show({
              template: 'Opening Wallet. Check your BitLox...'
            });

            $scope.openingWallet = wallet.number;

            wallet.open().then(function() {
              $scope.openWallet = wallet;
              $log.debug("WALLET LOADED");
              $log.debug(wallet.xpub);
              _importExtendedPublicKey(wallet);
            })
            .catch(function(err) {
              $log.debug("OPEN WALLET ERROR", err);
              $ionicLoading.hide();
              popupService.showAlert(gettextCatalog.getString('Error'), err);
            })
            .finally(function(status) {
              $log.debug("open notify", status);
              if (status === bitloxWallet.NOTIFY_XPUB_LOADED) {
                $scope.loadingXpub = false;
              }
              $log.debug("done loading wallet", wallet.number);
              $scope.openingWallet = -99;
            });
          });
        };

        $scope.formData = { directOpenNumber:  0 };
        $scope.directLoad = function() {
          var wallet = new bitloxWallet({
            wallet_number: parseInt($scope.formData.directOpenNumber, 10)
          });

          $scope.loadWallet(wallet);
        };

        $scope.showLinkWalletModal = function() {
          $ionicModal.fromTemplateUrl('views/modals/link-wallet.html', {
            scope: $scope,
            focusFirstInput: true
          }).then(function(modal) {
            $scope.linkWalletByIdModal = modal;
            $scope.linkWalletByIdModal.show();
          });
        };

        $scope.hideLinkWalletModal = function() {
          $scope.linkWalletByIdModal.hide();
        };

        $scope.showMnemonicModal = function() {
          $ionicModal.fromTemplateUrl('views/modals/mnemonic.html', {
            scope: $scope,
            focusFirstInput: true
          }).then(function(modal) {
            $scope.mnemonicModal = modal;
            $scope.mnemonicModal.show();
          });
        };

        $scope.hideMnemonicModal = function() {
          $scope.mnemonicModal.hide();
        };

        $scope.showWordIndexes = false;
        $scope.BIP39Words = []

        $scope.confirmMnemonicPhrase = function(userWords) {
          var _userPhrases = userWords.split(/\s+/);
          $scope.BIP39Words = []
          var isValid = true
          if(_userPhrases.length !== 12 && _userPhrases.length !== 18 && _userPhrases.length !== 24) {
            isValid = false
          }
          _userPhrases.forEach(function(phrase) {
            var phraseIndex = BIP39WordList.indexOf(phrase);
            if(phraseIndex === -1) {
              isValid = false;
            }
            $scope.BIP39Words.push({phrase: phrase, index: phraseIndex})
          });

          if(!isValid) {
            $scope.BIP39Words = []
            $ionicPopup.show({
              template: 'Invalid Mnemonic Phrase',
              cssClass: 'no-header',
              buttons: [{
                text: 'OK',
                type: 'button-primary',
                onTap: function() {
                  return false;
                }
              }]
            });
          } else {
              $scope.showWordIndexes = true
              $scope.newWallet.isRestore = true;
              $scope.hideMnemonicModal();
              $scope.createWallet();
          }
        };

        $scope.prepForFlash = function() {
            $scope.flashing = true;
            api.flash().catch(Toast.errorHandler)
                .finally(function() {
                    $scope.flashing = false;
                });
        };


        $scope.refreshAvailableNumbers = function(wallets) {
            if (!wallets) {
                return;
            }
            // assemble array of wallet numbers
            var available = [];
            for(var i = 0; i < (MAX_WALLETS + 1); i++) {
                available.push(i);
            }
            // now loop through the wallets and remove existing
            // numbers
            wallets.forEach(function(wallet) {
                available.splice(available.indexOf(wallet.number), 1);
            });
            // set to the vm for the new wallet form
            $scope.availableWalletNumbers = available;
            if (available && available.length) {
                // also set some default values for that form
                $scope.newWallet.name = "Wallet " + available[0];
                $scope.newWallet.number = available[0];
            }
        }

        $scope.initializeDevice = function() {
            var session = new Date().getTime(true);

            $scope.timer = true;
            $timeout.cancel($scope.timeout)
            api.initialize(session).then(function(res) {
                if(!res || res.type === api.TYPE_ERROR) {
                    $ionicLoading.hide();
                    popupService.showAlert(gettextCatalog.getString('Error'), "BitLox Initialization Error.");
                    api.disconnect();
                }
            });
        }
        $scope.reset = function() {
            // status variables
            $scope.readingWallets = true;
            $scope.openingWallet = -99;
            $scope.scanningWallet = false;
            $scope.creatingWallet = false;
            $scope.refreshingBalance = false;
            $scope.openWallet = null;
            $scope.timer = false;
            if($state.current.url === '/attach-bitlox') {
              api.disconnect();
            }

            $scope.timeout = $timeout(function() {
                $scope.timer = true;
                $ionicLoading.hide();
            }, 3000);

            // if($state.current.url === '/attach-bitlox' || $state.current.url === '/create-bitlox') {
            //   $ionicLoading.show({template: "Finding BitLox, please wait...", duration:3000})
            // } else {
            // }

            $ionicLoading.show({template: "Finding BitLox, please wait..."})

            if(platformInfo.isChromeApp) {
                // api.disconnect().then(function() {
                    $timeout(function() {
                        api.device().then(function() {
                            if(api.getStatus() === api.STATUS_IDLE) {
                                $scope.readWallets();
                            }
                        })
                    },1000);
                // })
            } else {
                if(api.getStatus() === api.STATUS_IDLE) {
                    $scope.readWallets();
                }
            }
        }

        $scope.$on('destroy', function() {
          $scope.timer = true;
          $timeout.cancel($scope.timeout);
        });

        $scope.$on('$destroy', function() {
          $scope.linkWalletByIdModal.remove();
        });

        $scope.reset();
    }
})(window, window.angular, window.chrome);
