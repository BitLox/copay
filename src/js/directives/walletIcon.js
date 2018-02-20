'use strict';

angular.module('copayApp.directives')
  .directive('walletIcon', function() {
    var directive = {
      restrict: 'A',
      templateUrl: 'views/includes/walletIcon.html',
      scope: {
        wallet: '=',
        network: '=',
        bgcolor: '='
      },
      link: link
    };

    return directive;

    function link(scope) {
      scope.$watch("wallet", updateScope);
      scope.$watch("network", updateScope);

      updateScope();

      function updateScope() {
        scope.bitlox = false;

        if(scope.wallet
          && typeof(scope.wallet.isPrivKeyExternal) === 'function'
          && scope.wallet.isPrivKeyExternal()
          && scope.wallet.getPrivKeyExternalSourceName().indexOf('bitlox') > -1) {
          scope.bitlox = true;
        } else if (scope.wallet
          && scope.wallet.isPrivKeyExternalString
          && scope.wallet.getPrivKeyExternalSourceNameString.indexOf('bitlox') > -1) {
          scope.bitlox = true;
        }

        if (!scope.wallet && scope.network) {
          scope.wallet = { network: scope.network }
        }
      }
    }

  });
