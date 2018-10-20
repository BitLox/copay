'use strict';

angular.module('copayApp.directives')
  .directive('walletSelector', function($timeout, $ionicHistory) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/walletSelector.html',
      transclude: true,
      scope: {
        title: '=walletSelectorTitle',
        show: '=walletSelectorShow',
        wallets: '=walletSelectorWallets',
        selectedWallet: '=walletSelectorSelectedWallet',
        onSelect: '=walletSelectorOnSelect',
        onClose: '=walletSelectorOnClose'
      },
      link: function(scope, element, attrs) {
        scope.hide = function() {
          scope.show = false;
          if(scope.onClose && typeof(scope.onClose === 'function')) {
            scope.onClose()
          }
          if (!scope.selectedWallet) {
            $ionicHistory.goBack(-2);
          }
        };

        scope.selectWallet = function(wallet) {
          $timeout(function() {
            scope.hide();
          }, 100);
          scope.onSelect(wallet);
        };
      }
    };
  });
