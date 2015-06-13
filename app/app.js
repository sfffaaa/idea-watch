'use strict';

// Declare app level module which depends on views, and components
angular.module('ideaApp', [
  'ngRoute',
  'ideaApp.login',
  'ideaApp.app'
]).

.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
	$routeProvider
		.when('/login', {
			templateUrl: 'views/login.html',
			data: { requiredLogin: false }
		})
		.when('/test', {
			templateUrl: 'views/app.html',
			data: { requiredLogin: true }
		})
		.otherwise({redirectTo: '/login'});

	$httpProvider.interceptors.push('TokenInterceptor');
}])

.run(function($rootScope, $location, AuthenticationService) {
	$rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
		if (nextRoute.data.requiredLogin && !AuthenticationService.isLogged) {
			$location.path("/login");
		}
	});
});
