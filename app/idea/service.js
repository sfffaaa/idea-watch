"use strict";

angular.module('ideaApp.idea.service', ['ui.bootstrap', 'angular-bootstrap-select'])

.service('questionMWHandler', ['$log', function($log) {

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
				templateUrl: 'modal/modal.html',
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
}])

.service('questionHandler',
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
}])

.service('ideaHandler',
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
}])

.service('nounHandler',
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
}])

.service('observeHandler',
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


