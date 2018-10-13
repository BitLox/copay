'use strict';

angular.module('copayApp.controllers').controller('linkAursController', function($rootScope, $q, $stateParams, $scope, $http, $httpParamSerializer, $interval, $filter, $timeout, $ionicScrollDelegate, ionicToast, gettextCatalog, walletService, platformInfo, lodash, configService, $stateParams, $window, $state, $log, profileService, $ionicModal, popupService, $ionicLoading, $ionicHistory, $ionicConfig, $ionicPopup, $window) {

  $scope.formA = {
    phone: '',
    name: '',
    email: '',
    img: null,
    pincode: null,
    bitcoinAddress: null,
    bitcoinWalletName: null,
    appId: device.uuid,
    address1:null,
    address2:null,
    city:null,
    state:null,
    country:null,
    gender:null,
    dob:null,
    idNumber:null,
    phone2:null,
    maritalStatus:null,
    aursCentralBalance:null,
    aursCCBalance:null,
    btcCCBalance:null,
    aursWalletXpub: null,
    btcWalletXpub: null,
    aursWalletName: null,
    aursCentralUsername:null,
    aursCCUsername:null,    
  }
  $scope.optionalFields = ['archived', 'address2', 'img', 'isVerified', 'aursCCUsername', 'aursCentralUsername', 'btcCCBalance', 'aursCCBalance', 'aursCentralBalance']
  $scope.$on("$ionicView.beforeLeave", function(event, data) {
    
  });

  function refresh() {
    $timeout(function() {
      $scope.$apply();
    }, 1);
  }

  $scope.showBtcWalletSelector = function() {
    $scope.btcWalletSelector = true;
    refresh();
  };
  $scope.showAursWalletSelector = function() {
    $scope.aursWalletSelector = true;
    refresh();
  };

  $scope.$on("$ionicView.enter", function(event, data) {
   
    
  });

  function exitWithError(err) {
    $log.info('Error setting verification:' + err);
    popupService.showAlert(gettextCatalog.getString("Error"), err, function() {
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        historyRoot: true
      });
      $ionicHistory.clearHistory();
      $state.go('tabs.home');
    });
  }

  $scope.onAursWalletSelect = function(wallet) {
    $scope.formA.aursWalletXpub = lodash.pluck(wallet.credentials.publicKeyRing, 'xPubKey').pop()
    $scope.formA.aursWalletName = wallet.name;
    $scope.aursWallet = wallet;
  }
  $scope.onBtcWalletSelect = function(wallet) {
    $scope.formA.btcWalletXpub = lodash.pluck(wallet.credentials.publicKeyRing, 'xPubKey').pop()
    $scope.formA.bitcoinWalletName = wallet.name;
    walletService.getAddress(wallet, false, function(err, addr) {
      $scope.formA.bitcoinAddress = addr;
    })
    $scope.btcWallet = wallet;
  }

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.imgUploadPercentText = "";
    $scope.imgUploadPercentStyle = "";
    $scope.showInfoOnly = $stateParams.showInfoOnly
    $scope.showCameraOnly = $stateParams.showCameraOnly

    $scope.aursWalletSelectorTitle = gettextCatalog.getString('Select AURS wallet to link');
    $scope.btcWalletSelectorTitle = gettextCatalog.getString('Select BTC wallet to link');
    $scope.aursWallet = null;
    $scope.btcWallet = null;

    $scope.aursWallets = profileService.getWallets({
      onlyComplete: true,
      network: 'aureus'
    });

    if (!$scope.aursWallets || !$scope.aursWallets.length) {
      return exitWithError(gettextCatalog.getString('No Aureus wallets available'));
    }

    $scope.btcWallets = profileService.getWallets({
      onlyComplete: true,
      network: 'livenet'
    });

    if (!$scope.btcWallets || !$scope.btcWallets.length) {
      return exitWithError(gettextCatalog.getString('No Bitcoin wallets available'));
    }
  
    $scope.onAursWalletSelect($scope.aursWallets[0])
    $scope.onBtcWalletSelect($scope.btcWallets[0])

    if(!$scope.showCameraOnly) {
      if ($scope.aursWallets.length > 1) {
        $scope.showAursWalletSelector();
      }
      if ($scope.btcWallets.length > 1) {
        $scope.showBtcWalletSelector();     
      }
    }
    $scope.getPin()
  });

  $scope.getPin = function() {
    $scope.pinRecord = {}
    $ionicLoading.show({ template: "Please wait..." })
    $scope.formA.pincode = null;

    var URL = 'https://seed.aureus.live/api/verification'
    $http({
      method: 'POST',
      url: URL,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: $httpParamSerializer({appId: device.uuid})
    }).then(function(result) {
      // $log.warn(JSON.stringify(result))
      $scope.pinRecord = result.data
      result.data.btcCCBalance = parseFloat(result.data.btcCCBalance)
      result.data.aursCCBalance = parseFloat(result.data.aursCCBalance)
      result.data.aursCentralBalance = parseFloat(result.data.aursCentralBalance)
      $scope.formA = angular.extend($scope.formA, result.data)// $scope.formA.pincode = result.data.pincode
      $log.info("SUCCESS: Verification PIN retrieved");
      $ionicLoading.hide()
    }, function(err) {
      $log.info("ERROR: Verification PIN NOT RETRIEVED.", err);
      ionicToast.show(gettextCatalog.getString('Network error: cannot get pin code'), 'middle', false, 2000);
      $ionicLoading.hide();
      return $scope.goBack();
    });        
  }  
  $scope.sendInfoOnly = function() {
    var incomplete = [];
    for (var i in $scope.formA) {
      if($scope.optionalFields.indexOf(i) === -1 && !$scope.formA[i]) {
        incomplete.push(i)
      }
    }
    if(incomplete.length > 0) {
      ionicToast.show(gettextCatalog.getString("Please fill out ALL form fields and try again: " + incomplete.join(', ')), 'middle', false, 5000);
      return;
    }
   
    $ionicLoading.show({ template: "Uploading verification data..." })

    var URL = "https://seed.aureus.live/api/verification"
      $http({
        method: 'PUT',
        url: URL,
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        data: $httpParamSerializer($scope.formA)
      }).then(function() {
        $log.info("SUCCESS: Verification sent");
        $ionicLoading.hide();     
        ionicToast.show(gettextCatalog.getString('Verification info updated.'), 'middle', false, 2000);
        
        var config = configService.getSync();

        var opts = {
          wallet: {
            linkedAursWallet: $scope.formA.aursWalletXpub,
            linkedBtcWallet: $scope.formA.btcWalletXpub
          }
        };
        configService.set(opts, function(err) {
          if (err) $log.debug(err);
          if($stateParams.showInfoOnly && $stateParams.isSettings) { return $scope.goBack(); }
          else if($scope.pinRecord.name) { return $scope.goBack(); } // means if this is a record update, we assume photo already uploaded
          else { return $scope.loadCameraOnly(); }
        });        
      }, function(err) {
        $ionicLoading.hide();
        $log.info("ERROR: Verification NOT SENT.", err);
        popupService.showAlert(gettextCatalog.getString('Error'), "Network error sending verification info");
      });    
  }

  function httpOverload(method, url, data) {
    var xhttp = new XMLHttpRequest();
    var promise = $q.defer();
    var progress = 1

    xhttp.open(method,url,true);
    xhttp.setRequestHeader('content-type', 'application/x-www-form-urlencoded; charset=UTF-8')


    xhttp.upload.addEventListener("progress",function (e) {
      if(progress < 100) { progress+=1 }

      promise.notify(progress);
    }, false);
    xhttp.upload.addEventListener("load",function (e) {
        promise.resolve(e);
    });
    xhttp.upload.addEventListener("error",function (e) {
        promise.reject(e);
    });

    xhttp.send(data);

    return promise.promise;    
  }  
  $scope.sendPhotoOnly = function() {

    $ionicLoading.show({ template: '<h4>Uploading verification data...</h4><div class="verification-loader" ng-style="imgUploadPercentStyle"><p class="percent" ng-bind="imgUploadPercentText"></p></div>'})

    navigator.camera.getPicture(function cameraSuccess(imageData) {
      $scope.formA.img = imageData;
      var URL = "https://seed.aureus.live/api/verification"


      httpOverload('PUT', URL, $httpParamSerializer($scope.formA)).then(function() {
        $log.info("SUCCESS: Verification sent");
        $ionicLoading.hide();
        var opts = {
          wallet: {
            uploadedVerification: true,
            linkedAursWallet: lodash.pluck($scope.aursWallet.credentials.publicKeyRing, 'xPubKey').pop(),
            linkedBtcWallet: lodash.pluck($scope.btcWallet.credentials.publicKeyRing, 'xPubKey').pop(),
          }
        };
        configService.set(opts, function(err) {
          if (err) $log.debug(err);
          ionicToast.show(gettextCatalog.getString('Verification uploaded. Your info will be processed.'), 'middle', false, 2000);
          return $scope.goBack();
        });        
      }, function(err) {
        $ionicLoading.hide();
        delete err.data
        $log.info("ERROR: Verification NOT SENT.", err);
        popupService.showAlert(gettextCatalog.getString('Error'), "Network error sending verification info");
      }, function(percent) {
        $rootScope.imgUploadPercentText = percent+"%"
        $rootScope.imgUploadPercentStyle = "width: "+percent+"%" 
      });
    }, function cameraError(error) {
      $ionicLoading.hide();
      $log.error("Unable to obtain picture: " + error, "app");
      popupService.showAlert(gettextCatalog.getString('Error'), "Unable to read photo.");
    }, {
      // Some common settings are 20, 50, and 100
      quality: 100,
      destinationType: Camera.DestinationType.DATA_URL,
      // In this app, dynamically set the picture source, Camera or photo gallery
      sourceType: Camera.PictureSourceType.CAMERA,
      encodingType: Camera.EncodingType.JPEG,
      mediaType: Camera.MediaType.PICTURE,
      allowEdit: false,
      correctOrientation: false  //Corrects Android orientation quirks
    });
  }
  $scope.loadCameraOnly = function() {
    $scope.showCameraOnly = true;
    $scope.showInfoOnly = false;
  };  
  $scope.goBack = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      historyRoot: true
    });
    $ionicHistory.clearHistory();
    if($stateParams.isSettings) { $state.transitionTo('tabs.settings'); }
    else { $state.transitionTo('tabs.home'); }
  };
});