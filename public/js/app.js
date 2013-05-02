'use strict';


// Declare app level module which depends on filters, and services
angular.module('rambler', ['ngCookies', 'ui', 'plaid', 'moments', 'map-utilities']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  	$routeProvider.when('/', {templateUrl: 'partials/onboard', controller: OnboardCtrl});
    $routeProvider.when('/onboard', {templateUrl: 'partials/onboard', controller: OnboardCtrl});
    // TechCrunch redirect, catch that AT
    $routeProvider.when('/main/y7LNJAMmBobL26LdimdAUiVCuZo=s9o0hFyce406e7e6469d3badab9cc5a4a814b4f26778b0e5713eb59aa21c022649b7933d26c65c5a4ac2850d3c320b60d3e3d7b28ffb7b141890bf87c9f99b3c94918478', {templateUrl: 'partials/onboard', controller:OnboardCtrl});
    $routeProvider.when('/main/:access_token', {templateUrl: 'partials/home', controller: MainCtrl});
    $routeProvider.otherwise({redirectTo: '/onboard'});
    $locationProvider.html5Mode(true);
  }]);