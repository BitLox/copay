'use strict';

angular.module('copayApp.controllers').controller('preferencesAltCurrencyController',
  function($scope, $log, $timeout, $ionicHistory, configService, rateService, lodash, profileService, walletService, storageService) {

    var next = 10;
    var completeAlternativeList = [];
    $scope.searchedAltCurrency = '';

    function init() {
      var unusedCurrencyList = [
        { isoCode: 'LTL' },
        { isoCode: 'BTC' }
      ];

      rateService.whenAvailable(function() {
        $scope.listComplete = false;

        var idx = lodash.indexBy(unusedCurrencyList, 'isoCode');
        var idx2 = lodash.indexBy($scope.lastUsedAltCurrencyList, 'isoCode');

        completeAlternativeList = lodash.reject(rateService.listAlternatives(true), function(c) {
          return idx[c.isoCode] || idx2[c.isoCode];
        });

        $scope.altCurrencyList = completeAlternativeList.slice(0, 10);

        $timeout(function() {
          $scope.$apply();
        });
      });
    }

    $scope.loadMore = function() {
      if ($scope.searchedAltCurrency) {
        $scope.listComplete = true;
        return;
      }

      $timeout(function() {
        $scope.altCurrencyList = completeAlternativeList.slice(0, next);
        next += 10;

        $scope.listComplete = $scope.altCurrencyList.length >= completeAlternativeList.length;
        $scope.$broadcast('scroll.infiniteScrollComplete');
      }, 100);
    };

    $scope.findCurrency = function(search) {
      $scope.searchedAltCurrency = search;

      if (!search) init();

      $scope.altCurrencyList = lodash.filter(completeAlternativeList, function(item) {
        var val = item.name;
        return lodash.includes(val.toLowerCase(), search.toLowerCase());
      });

      $timeout(function() {
        $scope.$apply();
      });
    };

    $scope.save = function(newAltCurrency) {
      var opts = {
        wallet: {
          settings: {
            alternativeName: newAltCurrency.name,
            alternativeIsoCode: newAltCurrency.isoCode,
          }
        }
      };

      configService.set(opts, function(err) {
        if (err) $log.warn(err);

        if (!$scope.inAmount) {
          $ionicHistory.goBack();
        } else {
          // ok method from itemSelector.js
          $scope.ok();
        }

        saveLastUsed(newAltCurrency);
        // walletService.updateRemotePreferences(profileService.getWallets());
      });
    };

    function saveLastUsed(newAltCurrency) {
      $scope.lastUsedAltCurrencyList.unshift(newAltCurrency);
      $scope.lastUsedAltCurrencyList = lodash.uniq($scope.lastUsedAltCurrencyList, 'isoCode');
      $scope.lastUsedAltCurrencyList = $scope.lastUsedAltCurrencyList.slice(0, 3);
      storageService.setLastCurrencyUsed(JSON.stringify($scope.lastUsedAltCurrencyList), function() {});
    }

    function beforeEnter(event, data) {
      $scope.currentCurrency = configService.getSync().wallet.settings.alternativeIsoCode;
      storageService.getLastCurrencyUsed(function(err, lastUsedAltCurrency) {
        $scope.lastUsedAltCurrencyList = lastUsedAltCurrency ? JSON.parse(lastUsedAltCurrency) : [];
        $log.warn("last currency used", $scope.lastUsedAltCurrencyList[0])
        init();
      });
    }

    $scope.$on("$ionicView.beforeEnter", beforeEnter);
    $scope.$on("$ionicModal.beforeEnter", beforeEnter);
  });
