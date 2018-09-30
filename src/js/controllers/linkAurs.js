'use strict';

angular.module('copayApp.controllers').controller('linkAursController', function($rootScope, $scope, $interval, $filter, $timeout, $ionicScrollDelegate, gettextCatalog, walletService, platformInfo, lodash, configService, $stateParams, $window, $state, $log, profileService, $ionicModal, popupService, $ionicHistory, $ionicConfig, $ionicPopup, $window) {

  $scope.pincode = 0000;
  $scope.formA = {
    phone: '',
    name: '',
    email: ''
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
    navigator.camera.getPicture(function cameraSuccess(imageUri) {
      console.log(imageUri)
      console.log(imageUri)      
      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      

      console.log(imageUri)
      console.log(imageUri)      



      $window.resolveLocalFileSystemURL(cordova.file.cacheDirectory, function success(dirEntry) {

          // JPEG file
          dirEntry.getFile("tempFile.jpeg", { create: true, exclusive: false }, function (fileEntry) {

              // Do something with it, like write to it, upload it, etc.
              // writeFile(fileEntry, imgUri);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              console.log("got file: " + fileEntry.fullPath);
              // displayFileData(fileEntry.fullPath, "File copied to");

          }, onErrorCreateFile);

      }, onErrorResolveUrl);

    }, function cameraError(error) {
        console.log("Unable to obtain picture: " + error, "app");
    }, {
          // Some common settings are 20, 50, and 100
          quality: 100,
          destinationType: Camera.DestinationType.FILE_URI,
          // In this app, dynamically set the picture source, Camera or photo gallery
          sourceType: Camera.PictureSourceType.CAMERA,
          encodingType: Camera.EncodingType.JPEG,
          mediaType: Camera.MediaType.PICTURE,
          allowEdit: true,
          correctOrientation: true  //Corrects Android orientation quirks
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
