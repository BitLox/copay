'use strict';

angular.module('copayApp.controllers').controller('linkAursController', function($rootScope, $stateParams, $scope, $http, $httpParamSerializer, $interval, $filter, $timeout, $ionicScrollDelegate, ionicToast, gettextCatalog, walletService, platformInfo, lodash, configService, $stateParams, $window, $state, $log, profileService, $ionicModal, popupService, $ionicLoading, $ionicHistory, $ionicConfig, $ionicPopup, $window) {

  $scope.formA = {
    phone: '',
    name: '',
    email: '',
    img: null,
    pincode: null,
    bitcoinAddress: null,
    bitcoinWalletName: null,
    appId: device.uuid
  }
  $scope.$on("$ionicView.beforeLeave", function(event, data) {
    
  });

  $scope.$on("$ionicView.enter", function(event, data) {
   
    $scope.getNewPin()
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
     $scope.showInfoOnly = $stateParams.showInfoOnly
     $scope.showCameraOnly = $stateParams.showCameraOnly
  });

  $scope.getNewPin = function() {
    $ionicLoading.show({ template: "Please wait..." })
    $scope.formA.pincode = null;
    var wallets = profileService.getWallets();
    for(var i in wallets) {
      if(wallets[i].network === 'livenet') {
        $scope.formA.bitcoinWalletName = wallets[i].name;
        walletService.getAddress(wallets[i], false, function(err, addr) {
          $scope.formA.bitcoinAddress = addr;
          $log.warn($scope.formA.bitcoinWalletName)
          $log.warn($scope.formA.bitcoinAddress)
        })
        break;
      }
    }
    var URL = 'https://seed.aureus.cc/api/verification'
    $http({
      method: 'POST',
      url: URL,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: $httpParamSerializer({appId: device.uuid})
    }).then(function(result) {
      // $log.warn(JSON.stringify(result))
      $scope.formA.pincode = result.data.pincode
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
    if(!$scope.formA.name || !$scope.formA.email || !$scope.formA.phone) {
      ionicToast.show(gettextCatalog.getString("Please fill out ALL form fields and try again."), 'middle', false, 2000);
      return;
    }    
    $ionicLoading.show({ template: "Uploading verification data..." })

    var URL = "https://seed.aureus.cc/api/verification"
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
        ionicToast.show(gettextCatalog.getString('Verification info updated. Please upload verification photo.'), 'middle', false, 2000);
        
        var config = configService.getSync();
        if($stateParams.showInfoOnly && $stateParams.isSettings) { return $scope.goBack(); }
        else { return $scope.loadCameraOnly(); }
      }, function(err) {
        $ionicLoading.hide();
        $log.info("ERROR: Verification NOT SENT.", err);
        popupService.showAlert(gettextCatalog.getString('Error'), "Network error sending verification info");
      });    
  }
  $scope.sendPhotoOnly = function() {

    $ionicLoading.show({ template: "Uploading verification data..." })

    navigator.camera.getPicture(function cameraSuccess(imageData) {
      $scope.formA.img = imageData;
      var URL = "https://seed.aureus.cc/api/verification"
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
        var opts = {
          wallet: {
            uploadedVerification: true
          }
        };
        configService.set(opts, function(err) {
          if (err) $log.debug(err);
        });        
        ionicToast.show(gettextCatalog.getString('Verification uploaded. Your info will be processed.'), 'middle', false, 2000);
        return $scope.goBack();
      }, function(err) {
        $ionicLoading.hide();
        delete err.data
        $log.info("ERROR: Verification NOT SENT.", err);
        popupService.showAlert(gettextCatalog.getString('Error'), "Network error sending verification info");
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