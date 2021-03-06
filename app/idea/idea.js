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

angular.module('ideaApp.idea', ['ui.bootstrap', 'angular-bootstrap-select', 'ideaApp.idea.service'])

.controller('questionController',
	['$scope', '$http', '$modal', '$log', '$rootScope', 'questionMWHandler', 'questionHandler',
	 'ideaHandler', 'ITEMS_PER_PAGE', 'MAX_PAGE_SIZE',
	function ($scope, $http, $modal, $log, $rootScope, questionMWHandler, questionHandler, 
	 ideaHandler, ITEMS_PER_PAGE, MAX_PAGE_SIZE) {

	//static member
	$rootScope.questions = null;

	//public member

	//public function
	$scope.isSelectedRow = _isSelectedRaw;
	$scope.setClickedRow = _setClickedRow;

	$scope.isDetailBtnEnable = _isDetailBtnEnable;
	$scope.isEditBtnEnable = _isEditBtnEnable;
	$scope.isDeleteBtnEnable = _isDeleteBtnEnable;
	$scope.isAddBtnEnable = _isAddBtnEnable;
	$scope.clickDetailBtn = _clickDetailBtn;
	$scope.clickEditBtn = _clickEditBtn;
	$scope.clickDeleteBtn = _clickDeleteBtn;
	$scope.clickAddBtn = _clickAddBtn;

	//Pagging
	$scope.currentPage = 1;
	$scope.itemsPerPage = ITEMS_PER_PAGE;
	$scope.maxSize = MAX_PAGE_SIZE;

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
	function _isDetailBtnEnable() {
		return null != _selectedRow;
	}
	function _clickDetailBtn() {
		var question = $rootScope.questions[($scope.currentPage - 1) * $scope.itemsPerPage + _selectedRow];

		questionMWHandler.setup.call(this,
			questionMWHandler.createInst($modal, {
				'modalType': 'detail',
				'templateUrl': 'idea/questionDetailModalWindow.html',
				'selectedQuestion': question
			}),
			//Success
			function(result) {
				$log.debug("finish");
			},
			//Failure
			function(result) {
				$log.debug("failure");
			}
		);

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
		var question = $rootScope.questions[($scope.currentPage - 1) * $scope.itemsPerPage + _selectedRow];

		questionMWHandler.setup.call(this,
			questionMWHandler.createInst($modal, {
				'modalType': 'edit',
				'templateUrl': 'idea/questionModalWindow.html',
				'selectedQuestion': question
			}),
			//Success
			function(result) {
				_questionEdit(result.question);
			},
			//Failure
			function(result) {
				$log.debug("failure");
			}
		);
	}
	function _isDeleteBtnEnable() {
		return null != _selectedRow;
	}
	function _clickDeleteBtn() {
		_questionDelete($rootScope.questions[($scope.currentPage - 1) * $scope.itemsPerPage + _selectedRow]);
	}
	function _isAddBtnEnable() {
		return true;
	}
	function _clickAddBtn() {
		questionMWHandler.setup.call(this,
			questionMWHandler.createInst($modal, {
				'modalType': 'add',
				'templateUrl': 'idea/questionModalWindow.html',
				'selectedQuestion': null
			}),
			//Success
			function(result) {
				_questionAdd(result.question);
			},
			//Failure
			function(result) {
				$log.debug("failure");
			}
		);
	};
}])

.controller('questionMWController', 
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
}])

.controller('ideaController',
	['$scope', '$http', '$modal', '$log', '$rootScope', 'ideaHandler', 'nounHandler',
	'ideaMWHandler', 'ITEMS_PER_PAGE', 'MAX_PAGE_SIZE',
	function ($scope, $http, $modal, $log, $rootScope, ideaHandler, nounHandler,
	ideaMWHandler, ITEMS_PER_PAGE, MAX_PAGE_SIZE) {

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

	//Pagging
	$scope.currentPage = 1;
	$scope.itemsPerPage = ITEMS_PER_PAGE;
	$scope.maxSize = MAX_PAGE_SIZE;

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
		var idea = $rootScope.ideas[($scope.currentPage - 1) * $scope.itemsPerPage + _selectedRow];
		ideaMWHandler.setup.call(this,
			ideaMWHandler.createInst($modal, {
				'modalType': 'detail',
				'selectedIdea': idea
			}),
			//Success
			function(result) {
				$log.debug("finish");
			},
			//Failure
			function(result) {
				$log.debug("failure");
			}
		);

		$log.debug("click detail btn", idea);
	}
	function _isStatisticBtnEnable() {
		return true;
	}
	function _clickStatisticBtn() {
		var idea = $rootScope.ideas[($scope.currentPage - 1) * $scope.itemsPerPage + _selectedRow];
		$log.debug("click statistic", idea);
	}
}])

.controller('ideaMWController', 
	['$scope', '$modalInstance', '$log', 'config', 
	function ($scope, $modalInstance, $log, config) {

	//public member
	$scope.idea = null;
	$scope.modalTitle = null;

	//public function
	$scope.ok = _ok;

	//Run
	_initIdea();
	_initModalTitle();

	//private function
	function _initModalTitle() {
		var modalType = config.modalType;
		if ("detail" === modalType) {
			$scope.modalTitle = "Detail";
		} else {
			$scope.modalTitle = "Modal window";
		}
	}
	function _initIdea() {
		var idea = config.selectedIdea;
		if (null != idea) {
			$scope.idea = idea;
		} else {
			console.log('idea is null!!!');
		}
	}
	function _ok() {
		$modalInstance.close({'modalType': config.modalType});
	}
}])

.controller('observeController',
	['$scope', '$http', '$modal', '$log', '$rootScope', 'observeHandler',
	'ITEMS_PER_PAGE', 'MAX_PAGE_SIZE', 'observeMWHandler',
	function ($scope, $http, $modal, $log, $rootScope, observeHandler,
	ITEMS_PER_PAGE, MAX_PAGE_SIZE, observeMWHandler) {

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

	//Pagging
	$scope.currentPage = 1;
	$scope.itemsPerPage = ITEMS_PER_PAGE;
	$scope.maxSize = MAX_PAGE_SIZE;

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
		var observe = $rootScope.observes[($scope.currentPage - 1) * $scope.itemsPerPage + _selectedRow];
		observeMWHandler.setup.call(this,
			observeMWHandler.createInst($modal, {
				'modalType': 'detail',
				'selectedObserve': observe
			}),
			//Success
			function(result) {
				$log.debug("finish");
			},
			//Failure
			function(result) {
				$log.debug("failure");
			}
		);

		$log.debug("click detail btn", observe);
	}
	function _isStatisticBtnEnable() {
		return true;
	}
	function _clickStatisticBtn() {
		var observe = $rootScope.observes[($scope.currentPage - 1) * $scope.itemsPerPage + _selectedRow];
		$log.debug("click statistic", observe);
	}
	function _clickSubmit() {
		_observeAdd($scope.observeToday);
	}
}])

.controller('observeMWController', 
	['$scope', '$modalInstance', '$log', 'config', 
	function ($scope, $modalInstance, $log, config) {

	//public member
	$scope.observe = null;
	$scope.modalTitle = null;

	//public function
	$scope.ok = _ok;

	//Run
	_initObserve();
	_initModalTitle();

	//private function
	function _initModalTitle() {
		var modalType = config.modalType;
		if ("detail" === modalType) {
			$scope.modalTitle = "Detail";
		} else {
			$scope.modalTitle = "Modal window";
		}
	}
	function _initObserve() {
		var observe = config.selectedObserve;
		if (null != observe) {
			$scope.observe = observe;
		} else {
			console.log('observe is null!!!');
		}
	}
	function _ok() {
		$modalInstance.close({'modalType': config.modalType});
	}
}])

.controller('overviewController',
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
	$scope.randomNounQuestionLoaded = _randomNounQuestionLoaded;
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
		_ideaAdd($scope.ideaToday, _randomNouns, _randomQuestion._id);
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
			if (_randomQuestion) {
				$scope.randomQuestionStr = selectQuestion.question;
			} else {
				$scope.randomQuestionStr = null;
			}
		});
	}
	function _randomNounQuestionLoaded() {
		if (false == _isQuestionLoaded() && false == _isRandomNounLoaded()) {
			return 'QRnotReady';
		} else if (false == _isQuestionLoaded() && true == _isRandomNounLoaded()) {
			return 'QnotReady';
		} else if (true == _isQuestionLoaded() && false == _isRandomNounLoaded()) {
			return 'RnotReady';
		} else {
			return 'Ready';
		}
	}
	function _isQuestionLoaded() {
		if (null == _randomQuestion || null == $scope.randomQuestionStr) {
			return false;
		} else {
			return true;
		}
	}
	function _isRandomNounLoaded() {
		if (null == _randomNouns || null == $scope.randomNounsStr) {
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
}])

.controller('tabController',
	['$scope', '$log', function ($scope, $log) {

	//public function
	$scope.selectedTab = 0;
	$scope.isSelected = _isSelect;
	$scope.selectTab = _selectTab;

	//private member
	function _isSelect(nowTab) {
		return $scope.selectedTab == nowTab;
	}
	function _selectTab(nowTab) {
		$scope.selectedTab = nowTab;
	}
}])


