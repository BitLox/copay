'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function($rootScope, $timeout, $ionicHistory, $ionicModal, platformInfo, fingerprintService, openURLService, configService, $state) {
    var root = {};

    root.isPinModalOpen = false;

    var isChromeApp = platformInfo.isChromeApp;
    var isNW = platformInfo.isNW;

    root.restart = function() {
      var hashIndex = window.location.href.indexOf('#/');
      if (platformInfo.isCordova) {
        window.location = window.location.href.substr(0, hashIndex);
        $timeout(function() {
          $rootScope.$digest();
        }, 1);

      } else {
        // Go home reloading the application
        if (isChromeApp) {
          chrome.runtime.reload();
        } else if (isNW) {
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
          $timeout(function() {
            var win = require('nw.gui').Window.get();
            win.reload(3);
            //or
            win.reloadDev();
          }, 100);
        } else {
          window.location = window.location.href.substr(0, hashIndex);
        }
      }
    };

    root.fingerprintModal = function(trigger) {

      if(trigger && root.isTouchIDReadyInBackground) {
        root.fingerprintModalScope.checkFingerprint()
        return;
      }
      var scope = root.fingerprintModalScope = $rootScope.$new(true);
      scope.trigger = trigger
      $ionicModal.fromTemplateUrl('views/modals/fingerprintCheck.html', {
        scope: scope,
        animation: 'none',
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        scope.fingerprintCheckModal = modal;
        scope.openModal();
      });
      scope.openModal = function() {
        scope.fingerprintCheckModal.show();
        if(scope.trigger) {
          scope.checkFingerprint();
        } else {
          console.log("OOOOOOOOOOOK")
          root.isTouchIDReadyInBackground = true
        }
      };
      scope.hideModal = function() {
        root.isModalOpen = false;
        root.isTouchIDReadyInBackground = false
        scope.fingerprintCheckModal.hide();
      };
      scope.checkFingerprint = function() {
        root.isModalOpen = true;
        fingerprintService.check('unlockingApp', function(err) {
          if (err) return;
          scope.hideModal();
        });                
      }
    };

    root.pinModal = function(action) {

      var scope = $rootScope.$new(true);
      scope.action = action;
      $ionicModal.fromTemplateUrl('views/modals/pin.html', {
        scope: scope,
        animation: 'none',
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        scope.pinModal = modal;
        scope.openModal();
      });
      scope.openModal = function() {
        root.isModalOpen = true;
        scope.pinModal.show();
      };
      scope.hideModal = function() {
        scope.$emit('pinModalClosed');
        root.isModalOpen = false;
        scope.pinModal.hide();
      };
    };

    root.appLockModal = function(action, trigger) {

      if (root.isModalOpen) return;

      configService.whenAvailable(function(config) {
        var lockMethod = config.lock && config.lock.method;
        if (!lockMethod || lockMethod == 'none') return;

        if ((lockMethod == 'fingerprint' || lockMethod === 'face') && fingerprintService.isAvailable()) root.fingerprintModal(trigger);
        if (lockMethod == 'pin') root.pinModal(action);

      });
    }
    return root;
  });
