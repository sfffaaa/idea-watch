"use strict";

String.format = function() {
	// The string containing the format items (e.g. "{0}")
	// will and always has to be the first argument.
	var theString = arguments[0];

	// start with the second argument (i = 1)
	for (var i = 1; i < arguments.length; i++) {
		// "gm" = RegEx options for Global search (more than one instance)
		// and for Multiline search
		var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
		theString = theString.replace(regEx, arguments[i]);
	}

	return theString;
}

var jayQuestion = angular.module('jayQuestion', ['ui.bootstrap', 'ngRoute', 'angular-bootstrap-select']);

jayQuestion.factory('AuthenticationService', function() {
	var auth = {
		username: "",
		isLogged: false
	}
	return auth;
});

jayQuestion.factory('UserService', function($http) {
	return {
		logIn: function(username, password) {
			return $http.post('/api/login', {username: username, password: password});
		},
 
		logOut: function() {
		}
	}
});

jayQuestion.controller('AdminUserCtrl', ['$scope', '$location', '$window', 'UserService', 'AuthenticationService',
	function AdminUserCtrl($scope, $location, $window, UserService, AuthenticationService) {
		//Admin User Controller (login, logout)
		$scope.username = AuthenticationService.username;
		$scope.logIn = function logIn(username, password) {
			if (username !== undefined && password !== undefined) {
				UserService.logIn(username, password).success(function(data) {
					AuthenticationService.isLogged = true;
					AuthenticationService.username = username;
					$window.sessionStorage.token = data.token;
					$location.path("/test");
				}).error(function(status, data) {
					console.log(status);
					console.log(data);
					$location.path("/login");
				});
			}
		}
 
		$scope.logOut = function logout() {
			if (AuthenticationService.isLogged) {
				AuthenticationService.isLogged = false;
				delete $window.sessionStorage.token;
				$location.path("/login");
			}
		}
	}
]);

jayQuestion.factory('TokenInterceptor', function ($q, $window, $location, AuthenticationService) {
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
				AuthenticationService.isAuthenticated = true;
			}
			return response || $q.when(response);
		},
 
		/* Revoke client authentication if 401 is received */
		responseError: function(rejection) {
			if (rejection != null && rejection.status === 401 && ($window.sessionStorage.token || AuthenticationService.isAuthenticated)) {
				delete $window.sessionStorage.token;
				AuthenticationService.isAuthenticated = false;
				$location.path("/login");
			}
			return $q.reject(rejection);
		}
	};
});

jayQuestion.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
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
}]);

jayQuestion.run(function($rootScope, $location, AuthenticationService) {
	$rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
		if (nextRoute.data.requiredLogin && !AuthenticationService.isLogged) {
			$location.path("/login");
		}
	});
});

//-------------------------------------------------------------------

jayQuestion.service('questionMWHandler', ['$log', function($log) {

	var modalTypeList = ['add', 'edit'];

	var isModalTypeExist = function(modalType) {
		if (-1 < modalTypeList.indexOf(modalType)) {
			return true;
		} else {
			return false;
		}
	};
	var isConfigValid = function (config) {
		if (false == ('modalType' in config)) {
			return false;
		}
		if (false == isModalTypeExist(config.modalType)) {
			return false;
		}
		if (false == ('selectedQuestion' in config)) {
			return false;
		}
		return true;
	}

	return {
		createInst: function(modal, config) {
			if (false == isConfigValid(config)) {
				$log.info("config invalid");
				return null;
			}
			return modal.open({
				templateUrl: 'questionModalContent.html',
				controller: 'questionMWController',
				size: 'lg',
				resolve: {
					config: function() {
						return config;
					}
				}
			});
		},
		setup: function(modalInstance, successCallBack, failureCallBack) {
			modalInstance.result.then(function (result) {
				if ("add" != result.modalType &&
					"edit" != result.modalType) {
					$log.info(result);
				}
				successCallBack.call(this, result);
			}, function (result) {
				$log.info('Modal dismissed at: ' + new Date());
				failureCallBack.call(this, result);
			});
		}
	};
}]);

jayQuestion.service('questionHandler',
	['$http', '$q', '$log', function($http, $q, $log) {

	var questions = [];
	return {
		allQuestionGet: function(forceLoaded) {
			var deferred = $q.defer();
			if (false == forceLoaded && 0 != questions.length) {
				deferred.resolve(questions);
				return deferred.promise;
			}
			$http.get('/api/questionGet')
				.success(function(data) {
					questions = data.questions;
					deferred.resolve(questions);
				})
				.error(function(data) {
					$log.info('Error: ' + data);
					deferred.reject('Error: ' + data);
				});
			return deferred.promise;
		},
		questionAdd: function(question) {
			var deferred = $q.defer();
			$http({
				method: 'post',
				url: '/api/questionAdd',
				data: question,
				headers:{'Content-Type': 'application/json'}
			}).success(function(req) {
				deferred.resolve('success');
			}).error(function(req) {
				$log.info('Error: ', req);
				deferred.reject('Error: ' + req);
			});
			return deferred.promise;
		},
		questionEdit: function(question) {
			var deferred = $q.defer();
			$http({
				method: 'post',
				url: '/api/questionEdit',
				data: question,
				headers:{'Content-Type': 'application/json'}
			}).success(function(req) {
				deferred.resolve('success');
			}).error(function(req) {
				$log.info('Error: ', req);
				deferred.reject('Error: ' + req);
			});
			return deferred.promise;
		},
		questionDelete: function(question) {
			var deferred = $q.defer();
			$http({
				method: 'get',
				url: '/api/questionDelete',
				params: {'qid': question.qid}
			}).success(function(data) {
				deferred.resolve('success');
			}).error(function(data) {
				$log.info('Error: ', data);
				deferred.reject('Error: ' + req);
			});
			return deferred.promise;
		}
	};
}]);

jayQuestion.controller('questionController',
	['$scope', '$http', '$modal', '$log', '$rootScope', 'questionMWHandler', 'questionHandler', 'ideaHandler',
	function ($scope, $http, $modal, $log, $rootScope, questionMWHandler, questionHandler, ideaHandler) {

	//static member
	$rootScope.questions = null;

	//public member

	//public function
	$scope.isSelectedRow = _isSelectedRaw;
	$scope.setClickedRow = _setClickedRow;

	$scope.isEditBtnEnable = _isEditBtnEnable;
	$scope.isDeleteBtnEnable = _isDeleteBtnEnable;
	$scope.isAddBtnEnable = _isAddBtnEnable;
	$scope.clickEditBtn = _clickEditBtn;
	$scope.clickDeleteBtn = _clickDeleteBtn;
	$scope.clickAddBtn = _clickAddBtn;

	//Run
	_questionGet();

	//private member
	var _selectedRow = null;

	//private function
	function _questionGet() {
		questionHandler.allQuestionGet(true).then(function(questions) {
			$rootScope.questions = questions;
		});
	}
	function _questionAdd(question) {
		questionHandler.questionAdd(question).then(function(data) {
			return questionHandler.allQuestionGet(true);
		})
		.then(function(questions) {
			$rootScope.questions = questions;
			_selectedRow = null;
		});
	}
	function _questionEdit(question) {
		questionHandler.questionEdit(question).then(function(data) {
			return questionHandler.allQuestionGet(true);
		})
		.then(function(questions) {
			$rootScope.questions = questions;
			return ideaHandler.allIdeaGet(true);
		})
		.then(function(ideas) {
			$rootScope.ideas = ideas;
		});
;
	}
	function _questionDelete(question) {
		questionHandler.questionDelete(question).then(function(data) {
			return questionHandler.allQuestionGet(true);
		})
		.then(function(questions) {
			$rootScope.questions = questions;
			_selectedRow = null;
			return ideaHandler.allIdeaGet(true);
		})
		.then(function(ideas) {
			$rootScope.ideas = ideas;
		});
	}
	function _isSelectedRaw(index) {
		return index == _selectedRow;
	}
	function _setClickedRow(index) {
		if (index == _selectedRow) {
			_selectedRow = null;
		} else {
			_selectedRow = index;
		}
	}
	function _isEditBtnEnable() {
		return null != _selectedRow;
	}
	function _clickEditBtn() {
		var question = $rootScope.questions[_selectedRow];

		questionMWHandler.setup.call(this,
			questionMWHandler.createInst($modal, {
				'modalType': 'edit',
				'selectedQuestion': question
			}),
			//Success
			function(result) {
				_questionEdit(result.question);
			},
			//Failure
			function(result) {
				$log.info("failure");
			}
		);
	}
	function _isDeleteBtnEnable() {
		return null != _selectedRow;
	}
	function _clickDeleteBtn() {
		_questionDelete($rootScope.questions[_selectedRow]);
	}
	function _isAddBtnEnable() {
		return true;
	}
	function _clickAddBtn() {
		questionMWHandler.setup.call(this,
			questionMWHandler.createInst($modal, {
				'modalType': 'add',
				'selectedQuestion': null
			}),
			//Success
			function(result) {
				_questionAdd(result.question);
			},
			//Failure
			function(result) {
				$log.info("failure");
			}
		);
	};
}]);

jayQuestion.controller('questionMWController', 
	['$scope', '$modalInstance', '$log', 'config', 
	function ($scope, $modalInstance, $log, config) {

	//public member
	$scope.question = null;
	$scope.modalTitle = null;

	//public function
	$scope.ok = _ok;
	$scope.cancel = _cancel;

	//Run
	_initQuestion();
	_initModalTitle();

	//private function
	function _initModalTitle() {
		var modalType = config.modalType;
		if ("add" === modalType) {
			$scope.modalTitle = "Add question";
		} else if ("edit" === modalType) {
			$scope.modalTitle = "Edit question";
		} else {
			$scope.modalTitle = "Modal window";
		}
	}
	function _initQuestion() {
		var question = config.selectedQuestion;
		if (null != question) {
			$scope.question = question;
		} else {
			$scope.question = {'qid': null, 'question': ""};
		}
	}
	function _ok() {
		$modalInstance.close({'modalType': config.modalType, 'question': $scope.question});
	}
	function _cancel() {
		$modalInstance.dismiss('cancel');
	}
}]);


jayQuestion.service('ideaHandler',
	['$http', '$q', '$log', function($http, $q, $log) {

	var ideas = [];
	return {
		allIdeaGet: function(forceLoaded) {
			var deferred = $q.defer();
			if (false == forceLoaded && 0 != ideas.length) {
				deferred.resolve(ideas);
				return deferred.promise;
			}
			$http.get('/api/ideaGet')
				.success(function(data) {
					ideas = data.ideas;
					deferred.resolve(ideas);
			})
				.error(function(data) {
					$log.info('Error: ', data);
					deferred.reject('Error: ' + data);
			});
			return deferred.promise;
		},
		ideaAdd: function(idea) {
			var deferred = $q.defer();
			$http({
				method: 'post',
				url: '/api/ideaAdd',
				data: idea,
				headers:{'Content-Type': 'application/json'}
			}).success(function(req) {
				deferred.resolve('success');
			}).error(function(req) {
				$log.info('Error: ', req);
				deferred.reject('Error: ' + req);
			});
			return deferred.promise;
		}
	};
}]);

jayQuestion.service('nounHandler',
	['$http', '$q', '$log', function($http, $q, $log) {

	var nouns = [];
	return {
		randomNounGet: function(nounSize, isNeedTranslate) {
			var deferred = $q.defer();
			$http({
				method: 'get',
				url: '/api/randomNounGet',
				params: {'nounSize': nounSize, 'isNeedTranslate': isNeedTranslate}
			}).success(function(data) {
				nouns = data.nouns;
				deferred.resolve(nouns);
			}).error(function(data) {
				$log.info('Error: ', data);
				deferred.reject('Error: ' + data);
			});
			return deferred.promise;
		}
	};
}]);

jayQuestion.controller('ideaController',
	['$scope', '$http', '$modal', '$log', '$rootScope', 'ideaHandler', 'nounHandler',
	function ($scope, $http, $modal, $log, $rootScope, ideaHandler, nounHandler) {

	//static member
	$rootScope.ideas = null;

	//public member
	$scope.nounsStr = null;

	//public function
	$scope.isSelectedRow = _isSelectedRaw;
	$scope.setClickedRow = _setClickedRow;

	$scope.isDetailBtnEnable = _isDetailBtnEnable;
	$scope.clickDetailBtn = _clickDetailBtn;
	$scope.isStatisticBtnEnable = _isStatisticBtnEnable;
	$scope.clickStatisticBtn = _clickStatisticBtn;

	//Run
	_ideaGet();

	//private member
	var _selectedRow = null;
	var _questionLength = 0;

	//private function
	function _ideaGet() {
		ideaHandler.allIdeaGet(true).then(function(ideas) {
			$rootScope.ideas = ideas;
		});
	}
	function _isSelectedRaw(index) {
		return index == _selectedRow;
	}
	function _setClickedRow(index) {
		if (index == _selectedRow) {
			_selectedRow = null;
		} else {
			_selectedRow = index;
		}
	}
	function _isDetailBtnEnable() {
		return null != _selectedRow;
	}
	function _clickDetailBtn() {
		var idea = $rootScope.ideas[_selectedRow];
		$log.info("click detail btn", idea);
	}
	function _isStatisticBtnEnable() {
		return true;
	}
	function _clickStatisticBtn() {
		var idea = $rootScope.ideas[_selectedRow];
		$log.info("click statistic", idea);
	}
}]);

jayQuestion.service('observeHandler',
	['$http', '$q', '$log', function($http, $q, $log) {

	var observes = [];
	return {
		allObserveGet: function(forceLoaded) {
			var deferred = $q.defer();
			if (false == forceLoaded && 0 != observes.length) {
				deferred.resolve(this.ideas);
				return deferred.promise;
			}
			$http.get('/api/observeGet')
				.success(function(data) {
					observes = data.observes;
					deferred.resolve(observes);
				})
				.error(function(data) {
					$log.info('Error: ', data);
					deferred.reject('Error: ' + data);
				});
			return deferred.promise;
		},
		observeAdd: function(observedStr) {
			var deferred = $q.defer();
			$http({
				method: 'post',
				url: '/api/observeAdd',
				data: {'observe': observedStr},
				headers:{'Content-Type': 'application/json'}
			}).success(function(req) {
				deferred.resolve('success');
			}).error(function(req) {
				$log.info('Error: ', req);
				deferred.reject('Error: ' + data);
			});
			return deferred.promise;
		}
	};
}]);

jayQuestion.controller('observeController',
	['$scope', '$http', '$modal', '$log', '$rootScope', 'observeHandler',
	function ($scope, $http, $modal, $log, $rootScope, observeHandler) {

	//static member
	$rootScope.observes = null;

	//public member

	//public function
	$scope.isSelectedRow = _isSelectedRaw;
	$scope.setClickedRow = _setClickedRow;

	$scope.isDetailBtnEnable = _isDetailBtnEnable;
	$scope.clickDetailBtn = _clickDetailBtn;
	$scope.isStatisticBtnEnable = _isStatisticBtnEnable;
	$scope.clickStatisticBtn = _clickStatisticBtn;

	//Run
	_observeGet();

	//private member
	var _selectedRow = null;

	//private function
	function _observeGet() {
		observeHandler.allObserveGet(true).then(function(observes) {
			$rootScope.observes = observes;
		});
	}
	function _isSelectedRaw(index) {
		return index == _selectedRow;
	}
	function _setClickedRow(index) {
		if (index == _selectedRow) {
			_selectedRow = null;
		} else {
			_selectedRow = index;
		}
	}
	function _isDetailBtnEnable() {
		return null != _selectedRow;
	}
	function _clickDetailBtn() {
		var observe= $rootScope.observes[_selectedRow];
		$log.info("click detail btn", observe);
	}
	function _isStatisticBtnEnable() {
		return true;
	}
	function _clickStatisticBtn() {
		var observe = $rootScope.observes[_selectedRow];
		$log.info("click statistic", observe);
	}
	function _clickSubmit() {
		_observeAdd($scope.observeToday);
	}
}]);

jayQuestion.controller('overviewController',
	['$scope', '$http', '$modal', '$log', '$rootScope', 'questionHandler', 'ideaHandler', 'observeHandler', 'nounHandler',
	function ($scope, $http, $modal, $log, $rootScope, questionHandler, ideaHandler, observeHandler, nounHandler) {
	//static member
	$scope.selectType = [
		{'name': 'idea', 'value': 'idea', 'icon': 'fa-lightbulb-o'},
		{'name': 'observe', 'value': 'observe', 'icon': 'fa-neuter'}
	];

	//public member
	$scope.selected = $scope.selectType[0].name;
	$scope.observeToday = null;
	$scope.ideaToday = null;
	$scope.randomNounsStr = null;
	$scope.randomQuestionStr = null;

	//public function
	$scope.isSelectIdea = _isSelectIdea;
	$scope.isSelectObserve = _isSelectObserve;
	$scope.isRandomNounLoaded = _isRandomNounLoaded;
	$scope.clickObserveSubmit = _clickObserveSubmit;
	$scope.clickObserveClear = _clickObserveClear;
	$scope.clickRegenerate = _clickRegenerate;
	$scope.clickIdeaSubmit = _clickIdeaSubmit;
	$scope.clickIdeaClear = _clickIdeaClear;

	//init
	_randomNounGet();
	_randomQuestionGet();

	//private member
	var _randomNouns = null;
	var _randomQuestion = null;

	//private function
	function _observeAdd(observedStr) {
		observeHandler.observeAdd(observedStr).then(function(noUse) {
			return observeHandler.allObserveGet(true);
		})
		.then(function(observes) {
			$rootScope.observes = observes;
			$scope.observeToday = null;
		});
	}
	function _ideaAdd(ideaStr, randomNouns, qid) {
		ideaHandler.ideaAdd({'idea': ideaStr,
							 'nouns': randomNouns,
							 'qid': qid})
		.then(function(noUse) {
			return ideaHandler.allIdeaGet(true);
		})
		.then(function(ideas) {
			$rootScope.ideas = ideas;
			$scope.ideaToday = null;
		});
	}
	function _isSelectIdea(strSelect) {
		return strSelect == 'idea';
	}
	function _isSelectObserve(strSelect) {
		return strSelect == 'observe';
	}
	function _clickObserveSubmit() {
		_observeAdd($scope.observeToday);
	}
	function _clickObserveClear() {
		$scope.observeToday = null;
	}
	function _clickIdeaSubmit() {
		_ideaAdd($scope.ideaToday, _randomNouns, _randomQuestion.qid);
	}
	function _clickIdeaClear() {
		$scope.ideaToday = null;
	}
	function _randomNounGet() {
		nounHandler.randomNounGet(3, true).then(function(nouns) {
			_randomNouns = nouns;
			var processArr = [];
			for(var idx in nouns) {
				if ('translate' in nouns[idx]) {
					processArr.push(String.format('{0}({1})', nouns[idx].word, nouns[idx].translate));
				} else {
					processArr.push(String.format('{0}', nouns[idx].word));
				}
			}
			$scope.randomNounsStr = processArr.join(', ');
		});
	}
	function _randomQuestionGet() {
		questionHandler.allQuestionGet(false).then(function(questions) {
			var selectQuestion = questions[Math.floor(Math.random()*questions.length)];
			_randomQuestion = selectQuestion;
			$scope.randomQuestionStr = selectQuestion.question;
		});
	}
	function _isRandomNounLoaded() {
		if (null == _randomNouns || null == $scope.randomNounsStr ||
			null == _randomQuestion || null == $scope.randomQuestionStr) {
			return false;
		} else {
			return true;
		}
	}
	function _clickRegenerate() {
		_randomNouns = null;
		$scope.randomNounsStr = null;
		_randomQuestion = null;
		$scope.randomQuestionStr = null;
		_randomNounGet();
		_randomQuestionGet();
	}
}]);

