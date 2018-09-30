'use strict';

angular.module('copayApp.controllers').controller('linkAursController', function($rootScope, $scope, $http, $httpParamSerializer, $interval, $filter, $timeout, $ionicScrollDelegate, ionicToast, gettextCatalog, walletService, platformInfo, lodash, configService, $stateParams, $window, $state, $log, profileService, $ionicModal, popupService, $ionicLoading, $ionicHistory, $ionicConfig, $ionicPopup, $window, $log) {

  $scope.pincode = null;
  $scope.uuid = null;
  $scope.formA = {
    phone: '',
    name: '',
    email: '',
    img: null
  }
  $scope.$on("$ionicView.beforeLeave", function(event, data) {
    
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    window.plugins.uniqueDeviceID.get(
      function(uuid) {
        $scope.uuid = uuid;
        $scope.getNewPin()
      }, function() {
        ionicToast.show(gettextCatalog.getString('Unable to contact verification server. Please try again.'), 'middle', false, 2000);    
        $scope.goBack()
      }); 
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
     
  });

  $scope.getNewPin = function() {
    var URL = 'http://seed.aureus.live/api/verification'
    $http({
      method: 'POST',
      url: URL,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: $httpParamSerializer({appId: $scope.uuid})
    }).then(function() {
      $log.info("SUCCESS: Verification PIN retrieved");
      $ionicLoading.hide();
      ionicToast.show(gettextCatalog.getString('Verification uploaded. Your info will be processed.'), 'middle', false, 2000);
      return $scope.goBack();
    }, function(err) {
      $ionicLoading.hide();
      $log.info("ERROR: Verification PIN NOT RETRIEVED.", err);
      popupService.showAlert(gettextCatalog.getString('Error'), "Network error sending verification info");
    });        
  }  
  
  $scope.openCamera = function() {
    $ionicLoading.show({ template: "Uploading verification data..." })

    navigator.camera.getPicture(function cameraSuccess(imageData) {
      $scope.formA.img = imageData;
      $scope.formA.uuid = $scope.uuid;
      var URL = "http://seed.aureus.live/api/verification"
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
        ionicToast.show(gettextCatalog.getString('Verification uploaded. Your info will be processed.'), 'middle', false, 2000);
        return $scope.goBack();
      }, function(err) {
        $ionicLoading.hide();
        $log.info("ERROR: Verification NOT SENT.", err);
        popupService.showAlert(gettextCatalog.getString('Error'), "Network error sending verification info");
      });
    }, function cameraError(error) {
      $ionicLoading.hide();
      console.log("Unable to obtain picture: " + error, "app");
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
  $scope.goBack = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      historyRoot: true
    });
    $ionicHistory.clearHistory();
    $state.transitionTo('tabs.home');
  };
});