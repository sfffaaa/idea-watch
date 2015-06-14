'use strict';

// Declare app level module which depends on views, and components
angular.module('ideaApp', [
  'ngRoute',
  'ideaApp.login',
  'ideaApp.idea'
])

.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
	$routeProvider
		.when('/login', {
			templateUrl: 'login/login.html',
			data: { requiredLogin: false }
		})
		.when('/idea', {
			templateUrl: 'idea/idea.html',
			data: { requiredLogin: true }
		})
		.otherwise({redirectTo: '/login'});

	$httpProvider.interceptors.push('TokenInterceptor');
}])

.run(function($rootScope, $location, AuthenticationService) {
	$rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
		if (!nextRoute || !currentRoute) {
			$location.path("/login");
			return;
		}
		if (nextRoute.data.requiredLogin) {
			debugger;
		}
		if (nextRoute.data.requiredLogin && !AuthenticationService.isLogged) {
			$location.path("/login");
		}
	});
});
