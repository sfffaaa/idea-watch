"use strict";

angular.module('ideaApp.error.service', [])

.service('ErrorService',
	['$log', '$timeout', function($log, $timeout) {

	var errorMap = {
		'5566': 'You have wrong account or password',
	};
	return {
		getErrMsg: function(errorNumber) {
			var errString = 'System error, please contact Jay Pan';
			if (errorNumber in errorMap) {
				errString = errorMap[errorNumber];
			}
			return errString
		},
		getErrTime: function() {
			return 5*1000;
		}
	};
}]);
