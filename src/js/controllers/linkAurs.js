'use strict';

angular.module('copayApp.controllers').controller('linkAursController', function($rootScope, $scope, $http, $httpParamSerializer, $interval, $filter, $timeout, $ionicScrollDelegate, gettextCatalog, walletService, platformInfo, lodash, configService, $stateParams, $window, $state, $log, profileService, $ionicModal, popupService, $ionicHistory, $ionicConfig, $ionicPopup, $window, $log) {

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
    console.error("opening camera")
    console.error(JSON.stringify(navigator.camera))
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
        return onSuccessConfirm();
      }, function(err) {
        $log.info("ERROR: KYC NOT SENT.", err);
        return onSuccessConfirm();
      });

    }, function cameraError(error) {
        console.log("Unable to obtain picture: " + error, "app");
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
