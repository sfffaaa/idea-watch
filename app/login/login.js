"use strict";

angular.module('ideaApp.login', ['ideaApp.error.service'])

.factory('AuthenticationService', function() {
	this.isLogged = false;
	this.username = "";
	this.isAuthenticated = false;
	var auth = {
		username: this.username,
		isLogged: this.isLogged,
		isAuthenticated: this.isAuthenticated,
		setLogged: function(logged) {
			this.isLogged = logged;
		},
		setUsername: function(name) {
			this.username = name;
		},
		setAuthenticated: function(auth) {
			this.isAuthenticated = auth;
		},
		checkRouteAccessable: function() {
			return this.isLogged;
		}
	}
	return auth;
})

.factory('UserService', function($http) {
	return {
		logIn: function(username, password) {
			return $http.post('/api/login', {username: username, password: password});
		},
 
		logOut: function() {
		}
	}
})

.factory('TokenInterceptor', function ($q, $window, $location, AuthenticationService) {
	return {
		request: function (config) {
			config.headers = config.headers || {};
			if ($window.sessionStorage.token) {
				config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
			}
			return config;
		},
 
		requestError: function(rejection) {
			return $q.reject(rejection);
		},
 
		/* Set Authentication.isAuthenticated to true if 200 received */
		response: function (response) {
			if (response != null && response.status == 200 && $window.sessionStorage.token && !AuthenticationService.isAuthenticated) {
				AuthenticationService.setAuthenticated(true);
			}
			return response || $q.when(response);
		},
 
		/* Revoke client authentication if 401 is received */
		responseError: function(rejection) {
			if (rejection != null && rejection.status === 401 && ($window.sessionStorage.token || AuthenticationService.isAuthenticated)) {
				delete $window.sessionStorage.token;
				AuthenticationService.setAuthenticated(false);
				$location.path("/login");
			}
			return $q.reject(rejection);
		}
	};
})

.controller('AdminUserCtrl', ['$scope', '$location', '$window', 'UserService', 'AuthenticationService', 'ErrorService', '$timeout',
	function AdminUserCtrl($scope, $location, $window, UserService, AuthenticationService, ErrorService, $timeout) {
		//Admin User Controller (login, logout)
		$scope.username = AuthenticationService.username;
		$scope.errMsg = '';
		$scope.showError = function () {
			return $scope.errMsg !== '';
		}
		$scope.logIn = function logIn(username, password) {
			if (username !== undefined && password !== undefined) {
				UserService.logIn(username, password).success(function(data) {
					AuthenticationService.setLogged(true);
					AuthenticationService.setUsername(username);
					$scope.username = username;
					$window.sessionStorage.token = data.token;
					$location.path("/idea");
				}).error(function(status, data) {
					console.log(status);
					console.log(data);
					$scope.errMsg = ErrorService.getErrMsg(5566);
					$timeout(function() {
						$scope.errMsg = '';
					}, ErrorService.getErrTime());
				});
			}
		}
 
		$scope.logOut = function logout() {
			if (AuthenticationService.isLogged) {
				AuthenticationService.setLogged(false);
				delete $window.sessionStorage.token;
				$location.path("/login");
			}
		}
	}
]);
