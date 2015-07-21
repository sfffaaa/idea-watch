"use strict";

angular.module('ideaApp.idea.service', ['ui.bootstrap', 'angular-bootstrap-select',
	'ideaApp.login'])

.constant('ITEMS_PER_PAGE', 10)
.constant('MAX_PAGE_SIZE', 5)
.service('questionMWHandler', ['$log', function($log) {

	var modalTypeList = ['add', 'edit', 'detail'];

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
				$log.debug("config invalid");
				return null;
			}
			return modal.open({
				templateUrl: config.templateUrl,
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
				if ('add' != result.modalType &&
					'edit' != result.modalType &&
					'detail' != result.modalType) {
					$log.debug(result);
				}
				successCallBack.call(this, result);
			}, function (result) {
				$log.debug('Modal dismissed at: ' + new Date());
				failureCallBack.call(this, result);
			});
		}
	};
}])

.service('questionHandler',
	['$http', '$q', '$log', 'AuthenticationService', 'ErrorService', 
		function($http, $q, $log, AuthenticationService, ErrorService) {

	var questions = [];
	return {
		allQuestionGet: function(forceLoaded) {
			var deferred = $q.defer();
			if (false == forceLoaded && 0 != questions.length) {
				deferred.resolve(questions);
				return deferred.promise;
			}
			$http({
				method: 'get',
				url: '/api/questionGet',
				params: {
					'username': AuthenticationService.username
				}
			}).success(function(data) {
				if (true == data.success) {
					questions = data.questions;
					deferred.resolve(questions);
				} else {
					$log.debug('Error: ' + data);
					deferred.reject('Error: ' + data);
					ErrorService.setErrMsg(5566);
				}
			}).error(function(data) {
				$log.debug('Error: ' + data);
				deferred.reject('Error: ' + data);
				ErrorService.setErrMsg(5566);
			});
			return deferred.promise;
		},
		questionAdd: function(question) {
			var deferred = $q.defer();
			$http({
				method: 'post',
				url: '/api/questionAdd',
				data: {
					question: question.question,
					username: AuthenticationService.username
				},
				headers:{'Content-Type': 'application/json'}
			}).success(function(req) {
				if (true == req.success) {
					deferred.resolve('success');
				} else {
					$log.debug('Error: ' + data);
					deferred.reject('Error: ' + data);
					ErrorService.setErrMsg(5566);
				}
			}).error(function(req) {
				$log.debug('Error: ', req);
				deferred.reject('Error: ' + req);
				ErrorService.setErrMsg(5566);
			});
			return deferred.promise;
		},
		questionEdit: function(question) {
			var deferred = $q.defer();
			$http({
				method: 'post',
				url: '/api/questionEdit',
				data: {
					qid: question._id,
					question: question.question,
					username: AuthenticationService.username
				},
				headers:{'Content-Type': 'application/json'}
			}).success(function(req) {
				if (true == req.success) {
					deferred.resolve('success');
				} else {
					$log.debug('Error: ', req);
					deferred.reject('Error: ' + req);
					ErrorService.setErrMsg(5566);
				}
			}).error(function(req) {
				$log.debug('Error: ', req);
				deferred.reject('Error: ' + req);
				ErrorService.setErrMsg(5566);
			});
			return deferred.promise;
		},
		questionDelete: function(question) {
			var deferred = $q.defer();
			$http({
				method: 'get',
				url: '/api/questionDelete',
				params: {
					'qid': question._id
				}
			}).success(function(data) {
				if (true == data.success) {
					deferred.resolve('success');
				} else {
					$log.debug('Error: ', data);
					deferred.reject('Error: ' + req);
					ErrorService.setErrMsg(5566);
				}
			}).error(function(data) {
				$log.debug('Error: ', data);
				deferred.reject('Error: ' + req);
				ErrorService.setErrMsg(5566);
			});
			return deferred.promise;
		}
	};
}])

.service('ideaHandler',
	['$http', '$q', '$log', 'AuthenticationService', 'ErrorService',
		function($http, $q, $log, AuthenticationService, ErrorService) {

	var ideas = [];
	return {
		allIdeaGet: function(forceLoaded) {
			var deferred = $q.defer();
			if (false == forceLoaded && 0 != ideas.length) {
				deferred.resolve(ideas);
				return deferred.promise;
			}
			$http({
				method: 'get',
				url: '/api/ideaGet',
				params: {
					'username': AuthenticationService.username
				}
			}).success(function(data) {
				if (true == data.success) {
					ideas = data.ideas;
					deferred.resolve(ideas);
				} else {
					$log.debug('Error: ', data);
					deferred.reject('Error: ' + data);
					ErrorService.setErrMsg(5566);
				}
			}).error(function(data) {
				$log.debug('Error: ', data);
				deferred.reject('Error: ' + data);
				ErrorService.setErrMsg(5566);
			});
			return deferred.promise;
		},
		ideaAdd: function(idea) {
			var deferred = $q.defer();
			debugger;
			idea.username = AuthenticationService.username;

			$http({
				method: 'post',
				url: '/api/ideaAdd',
				data: {
					idea: idea.idea,
					nouns: idea.nouns,
					qid: idea.qid,
					username: AuthenticationService.username
				},
				headers:{'Content-Type': 'application/json'}
			}).success(function(req) {
				if (true == req.success) {
					deferred.resolve('success');
				} else {
					$log.debug('Error: ', req);
					deferred.reject('Error: ' + req);
					ErrorService.setErrMsg(5566);
				}
			}).error(function(req) {
				$log.debug('Error: ', req);
				deferred.reject('Error: ' + req);
				ErrorService.setErrMsg(5566);
			});
			return deferred.promise;
		}
	};
}])

.service('nounHandler',
	['$http', '$q', '$log', 'ErrorService', function($http, $q, $log, ErrorService) {

	var nouns = [];
	return {
		randomNounGet: function(nounSize, isNeedTranslate) {
			var deferred = $q.defer();
			$http({
				method: 'get',
				url: '/api/randomNounGet',
				params: {'nounSize': nounSize, 'isNeedTranslate': isNeedTranslate}
			}).success(function(data) {
				if (true == data.success) {
					nouns = data.nouns;
					deferred.resolve(nouns);
				} else {
					$log.debug('Error: ', data);
					deferred.reject('Error: ' + data);
					ErrorService.setErrMsg(5566);
				}
			}).error(function(data) {
				$log.debug('Error: ', data);
				deferred.reject('Error: ' + data);
				ErrorService.setErrMsg(5566);
			});
			return deferred.promise;
		}
	};
}])

.service('observeHandler',
	['$http', '$q', '$log', 'AuthenticationService', 'ErrorService',
		function($http, $q, $log, AuthenticationService, ErrorService) {

	var observes = [];
	return {
		allObserveGet: function(forceLoaded) {
			var deferred = $q.defer();
			if (false == forceLoaded && 0 != observes.length) {
				deferred.resolve(this.ideas);
				return deferred.promise;
			}

			$http({
				method: 'get',
				url: '/api/observeGet',
				params: {
					'username': AuthenticationService.username
				}
			}).success(function(data) {
				if (true == data.success) {
					observes = data.observes;
					deferred.resolve(observes);
				} else {
					$log.debug('Error: ', data);
					deferred.reject('Error: ' + data);
					ErrorService.setErrMsg(5566);
				}
			}).error(function(data) {
				$log.debug('Error: ', data);
				deferred.reject('Error: ' + data);
				ErrorService.setErrMsg(5566);
			});
			return deferred.promise;
		},
		observeAdd: function(observedStr) {
			var deferred = $q.defer();
			$http({
				method: 'post',
				url: '/api/observeAdd',
				data: {
					'observe': observedStr,
					'username': AuthenticationService.username
				},
				headers:{'Content-Type': 'application/json'}
			}).success(function(req) {
				if (true == req.success) {
					deferred.resolve('success');
				} else {
					$log.debug('Error: ', req);
					deferred.reject('Error: ' + data);
					ErrorService.setErrMsg(5566);
				}
			}).error(function(req) {
				$log.debug('Error: ', req);
				deferred.reject('Error: ' + data);
				ErrorService.setErrMsg(5566);
			});
			return deferred.promise;
		}
	};
}])

.service('observeMWHandler', ['$log', function($log) {

	var modalTypeList = ['detail'];

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
		if (false == ('selectedObserve' in config)) {
			return false;
		}
		return true;
	}

	return {
		createInst: function(modal, config) {
			if (false == isConfigValid(config)) {
				$log.debug("config invalid");
				return null;
			}
			return modal.open({
				templateUrl: 'idea/observeModalWindow.html',
				controller: 'observeMWController',
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
				if ('detail' != result.modalType) {
					$log.debug(result);
				}
				successCallBack.call(this, result);
			}, function (result) {
				$log.debug('Modal dismissed at: ' + new Date());
				failureCallBack.call(this, result);
			});
		}
	};
}])

.service('ideaMWHandler', ['$log', function($log) {

	var modalTypeList = ['detail'];

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
		if (false == ('selectedIdea' in config)) {
			return false;
		}
		return true;
	}

	return {
		createInst: function(modal, config) {
			if (false == isConfigValid(config)) {
				$log.debug("config invalid");
				return null;
			}
			return modal.open({
				templateUrl: 'idea/ideaModalWindow.html',
				controller: 'ideaMWController',
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
				if ('detail' != result.modalType) {
					$log.debug(result);
				}
				successCallBack.call(this, result);
			}, function (result) {
				$log.debug('Modal dismissed at: ' + new Date());
				failureCallBack.call(this, result);
			});
		}
	};
}]);
