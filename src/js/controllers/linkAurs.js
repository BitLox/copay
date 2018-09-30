'use strict';

angular.module('copayApp.controllers').controller('linkAursController', function($rootScope, $scope, $http, $httpParamSerializer, $interval, $filter, $timeout, $ionicScrollDelegate, ionicToast, gettextCatalog, walletService, platformInfo, lodash, configService, $stateParams, $window, $state, $log, profileService, $ionicModal, popupService, $ionicLoading, $ionicHistory, $ionicConfig, $ionicPopup, $window, $log) {

  $scope.pincode = 0000;
  $scope.formA = {
    phone: '',
    name: '',
    email: '',
    img: null
  }
  $scope.$on("$ionicView.beforeLeave", function(event, data) {
    
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    
  });


  $scope.$on("$ionicView.beforeEnter", function(event, data) {

    
  });
  
  $scope.openCamera = function() {
    $ionicLoading.show({ template: "Uploading verification data..." })

    var URL = "http://seed.aureus.live/"
    navigator.camera.getPicture(function cameraSuccess(imageData) {
      $scope.formA.img = imageData;
      $http({
        method: 'POST',
        url: URL,
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        data: $httpParamSerializer($scope.formA)
      }).then(function() {
        $log.info("SUCCESS: KYC sent");
        $ionicLoading.hide();
        ionicToast.show(gettextCatalog.getString('Verification uploaded. Your info will be processed.'), 'middle', false, 2000);
        return $scope.onSuccessConfirm();
      }, function(err) {
        $ionicLoading.hide();
        $log.info("ERROR: KYC NOT SENT.", err);
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
  $scope.onSuccessConfirm = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      historyRoot: true
    });
    $ionicHistory.clearHistory();
    $state.transitionTo('tabs.home');
  };

  

});
