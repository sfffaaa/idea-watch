'use strict';

// Declare app level module which depends on views, and components
angular.module('ideaApp', [
  'ngRoute',
  'ideaApp.error.service',
  'ideaApp.login',
  'ideaApp.idea'
])

.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
	$routeProvider
		.when('/login', {
			templateUrl: 'login/login.html'
		})
		.when('/idea', {
			templateUrl: 'idea/idea.html'
		})
		.otherwise({redirectTo: '/login'});

	$httpProvider.interceptors.push('TokenInterceptor');
}])

.run(function($rootScope, $location, AuthenticationService) {
	$rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
		if (!AuthenticationService.checkRouteAccessable()) {
			$location.path("/login");
		}
	});
});
