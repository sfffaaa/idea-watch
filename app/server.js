var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var moment = require('moment');
var _ = require('underscore')._;
var util = require('util');
var PythonShell = require('python-shell');
var async = require('async');

var tools = require('./tools');

var UserModel = require('./userModel').User;
var QuestionModel = require('./userModel').Question;
var IdeaModel = require('./userModel').Idea;
var ObserveModel = require('./userModel').Observe;

var sailsTokenAuth = require('./sailsTokenAuth');

//Test user
require('./userTest');

var QUESTION_JSON_PATH = './data/question.json';
var IDEA_JSON_PATH = './data/idea.json';
var OBSERVE_JSON_PATH = './data/observe.json';
var JSON_ENCODING_TYPE = 'utf8';

var JSONENTRY_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
var RANDOM_NOUN_DEFAULT_SIZE = 3;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.use(express.static(__dirname));

app.set('views', __dirname + '/app');
app.set('view engine', 'jade');

app.get('/', function(req, res) {
	res.sendFile('app/index.html', {root: __dirname});
});

app.post('/api/login', function(req, res) {
	var decData = JSON.parse(new Buffer(req.body.enc_data, 'base64').toString());
	var username = decData.username || '';
	var password = decData.password || '';
 
	if ('' === username || '' === password) {
		return res.sendStatus(401);
	}

	UserModel.findOne({username: username}, function (err, user) {
		if (err || null === user) {
			return res.sendStatus(401);
		}
 
		user.comparePassword(password, function (err, isMatch) {
			if (!isMatch) {
				console.log('Attempt failed to login with ' + user.username);
				return res.sendStatus(401);
			}

			return res.json({
				user: user.username, 
				token: sailsTokenAuth.issueToken(user.id)
			});
		});
	});
});

app.use(sailsTokenAuth.tokenAuth);

app.get('/api/questionGet', function(req, res) {
//	QuestionModel.find({}, '-__v -username', function(err, questions) {
//		console.log(data);
//		res.json({
//			'questions': questions
//		});
//	});
	//If not exist, write an empty json file into it.
	var questionJson = JSON.parse(fs.readFileSync(QUESTION_JSON_PATH, JSON_ENCODING_TYPE));
	res.json(questionJson);
});

app.post('/api/questionAdd', function(req, res) {

//	var question = new QuestionModel({
//		question: req.body.question,
//		username: 'a'
//	});
//	question.save(function(err) {
//		if (err) {
//			console.log(err);
//		}
//	});

	//If not exist, write an empty json file into it.
	var questionJson = JSON.parse(fs.readFileSync(QUESTION_JSON_PATH, JSON_ENCODING_TYPE));
	var nextMaxQid = 1;
	if (null != questionJson.maxqid) {
		nextMaxQid = questionJson.maxqid + 1;
	}
	questionJson.questions.push({
		'qid': nextMaxQid,
		'question': req.body.question
	});
	questionJson.maxqid = nextMaxQid;
	fs.writeFileSync(QUESTION_JSON_PATH, JSON.stringify(questionJson), JSON_ENCODING_TYPE);
	res.end('done');
});

app.post('/api/questionEdit', function(req, res) {

//	QuestionModel.findByIdAndUpdate(req.body.question, {
//		'question': req.body.question
//	}, function(err) {
//		if (err) {
//			console.log('----- questionEdit -----');
//			console.log(err);
//		}
//	});

	//If not exist, write an empty json file into it.
	var isNeedWrite = false;
	var questionJson = JSON.parse(fs.readFileSync(QUESTION_JSON_PATH, JSON_ENCODING_TYPE));
	var questions = questionJson.questions;

	for (var i in questions) {
		if (req.body.qid == questions[i].qid) {
			questions[i].question = req.body.question;
			isNeedWrite = true;
			break;
		}
	}
	if (true == isNeedWrite) {
		fs.writeFileSync(QUESTION_JSON_PATH, JSON.stringify(questionJson), JSON_ENCODING_TYPE);
	} else {
		console.log('qid not exist in file', req.body);
	}
	res.end('done');
});

app.get('/api/questionDelete', function(req, res) {

//	QuestionModel.remove({_id: req.query.qid}, function(err) {
//		if (err) {
//			console.log('----- questionDelete -----');
//			console.log(err);
//		}
//	});
//
//	IdeaModel.remove({qid: req.query.qid}, function(err) {
//		if (err) {
//			console.log('----- questionDelete -----');
//			console.log(err);
//		}
//	});

	//If not exist, write an empty json file into it.
	var questionJson = JSON.parse(fs.readFileSync(QUESTION_JSON_PATH, JSON_ENCODING_TYPE));
	var questions = questionJson.questions;
	var isNeedSyncQuestion = false;
	var isNeedSyncIdea = false;
	var deleteQid = req.query.qid || -1;

	questionJson.questions = _.reject(questionJson.questions, function(element) {
		if (deleteQid == element.qid) {
			isNeedSyncQuestion = true;
			return true;
		} else {
			return false;
		}
	});

	if (false == isNeedSyncQuestion) {
		res.end('done');
		return;
	}
	fs.writeFileSync(QUESTION_JSON_PATH, JSON.stringify(questionJson), JSON_ENCODING_TYPE);
	//Delete
	var ideaJson = JSON.parse(fs.readFileSync(IDEA_JSON_PATH, JSON_ENCODING_TYPE));
	ideaJson.ideas = _.reject(ideaJson.ideas, function(element) {
		if (deleteQid == element.qid) {
			isNeedSyncIdea = true;
			return true;
		} else {
			return false;
		}
	});
	if (true == isNeedSyncIdea) {
		fs.writeFileSync(IDEA_JSON_PATH, JSON.stringify(ideaJson), JSON_ENCODING_TYPE);
	}
	res.end('done');
});

app.get('/api/ideaGet', function(req, res) {
//[Not Yet]
	var isNeedSyncIdea = false;
	var ideaJson = JSON.parse(fs.readFileSync(IDEA_JSON_PATH, JSON_ENCODING_TYPE));
	//Need add question into this json file
	var questionJson = JSON.parse(fs.readFileSync(QUESTION_JSON_PATH, JSON_ENCODING_TYPE));
	var questionHash = {};
	_.each(questionJson.questions, function(element, idx) {
		questionHash[element.qid] = element.question;
	});
	ideaJson.ideas = _.reject(ideaJson.ideas, function(element) {
		if (element.qid in questionHash) {
			isNeedSyncIdea = true;
			return false;
		} else {
			return true;
		}
	});
	if (true == isNeedSyncIdea) {
		fs.writeFileSync(IDEA_JSON_PATH, JSON.stringify(ideaJson), JSON_ENCODING_TYPE);
	}

	_.each(ideaJson.ideas, function(element, idx) {
		element.qname = questionHash[element.qid];
	});

	//Need prettified the nous
	_.each(ideaJson.ideas, function(element, idx) {
		if (null == element.nouns) {
			return;
		}
		var nounArray = [];
		var nouns = JSON.parse(element.nouns);
		_.each(nouns, function(nounElem, nounIdx) {
			if (null != nounElem.translate) {
				nounArray.push(util.format('%s(%s)', nounElem.word, nounElem.translate));
			} else {
				nounArray.push(util.format('%s', nounElem.word));
			}
		});
		element.nouns = nounArray.join(', ');
	});

	//Need resorted the json by time
	ideaJson.ideas.sort(function(idea1, idea2) {
		return tools.strDateCompare(idea1.time, idea2.time);
	});
	res.json(ideaJson);
});

app.post('/api/ideaAdd', function(req, res) {

//	var idea = new IdeaModel({
//		idea: req.body.idea,
//		qid: req.body.qid,
//		nouns: JSON.stringify(req.body.nouns),
//		time: moment().format(JSONENTRY_TIME_FORMAT),
//		username: 'a'
//	});
//	idea.save(function(err) {
//		if (err) {
//			console.log(err);
//		}
//	});

	//If not exist, write an empty json file into it.
	var ideaJson = JSON.parse(fs.readFileSync(IDEA_JSON_PATH, JSON_ENCODING_TYPE));

	var nextMaxIdeaid = 1;
	if (null != ideaJson.maxideaid) {
		nextMaxIdeaid = ideaJson.maxideaid + 1;
	}
	ideaJson.ideas.push({
		'ideaid': nextMaxIdeaid,
		'idea': req.body.idea,
		'qid': req.body.qid,
		'nouns': JSON.stringify(req.body.nouns),
		'time': moment().format(JSONENTRY_TIME_FORMAT)
	});
	ideaJson.maxideaid = nextMaxIdeaid;
	fs.writeFileSync(IDEA_JSON_PATH, JSON.stringify(ideaJson), JSON_ENCODING_TYPE);

	res.end('done');
});

app.get('/api/observeGet', function(req, res) {

	ObserveModel.find({username: req.query.username}, '-__v -username', function(err, observe) {
		var data = observe || [];

		res.json({
			'observes': data
		});
	});
});

app.post('/api/observeAdd', function(req, res) {

	var observe = new ObserveModel({
		observe: req.body.observe,
		time: moment().format(JSONENTRY_TIME_FORMAT),
		username: req.body.username
	});
	observe.save(function(err) {
		if (err) {
			console.log(err);
			res.end(err);
		} else {
			res.end('done');
		}
	});
});

app.get('/api/randomNounGet', function(req, res) {

	var nounSize = req.query.nounSize || RANDOM_NOUN_DEFAULT_SIZE;
	var isNeedTranslate = req.query.isNeedTranslate || true;

	var processRawNounsToRandomArray = function(rawNounsData) {
		var nounArray = rawNounsData.toString().split('\n');
		var randomNounArray = [];
		for (var i = 0; i < nounSize; i++) {
			var randomIdx = Math.floor(Math.random() * nounArray.length);
			randomNounArray.push(nounArray[randomIdx]);
		}
		return randomNounArray;
	};
	var processRawTranslateToRandomTranslateArray = function(rawTranslateData) {
		return JSON.parse(rawTranslateData);
	};

	async.waterfall([
		function(callback) {
			fs.readFile('./data/words', function(err, data) {
				if (err) {
					throw err;
				}
				var randomNounArray = processRawNounsToRandomArray(data);
				callback(err, randomNounArray);
			});
		},
		function(randomNounArray, callback) {
			var options = {
				mode: 'text',
				pythonPath: '/usr/bin/python',
				scriptPath: './script',
				args: randomNounArray
			};
			PythonShell.run('translate.py', options, function (err, results) {
				//Setup the results
				var randomTraslateArray = null;
				if (null != results) {
					randomTraslateArray = processRawTranslateToRandomTranslateArray(results);
				}
				callback(err, randomNounArray, randomTraslateArray);
			});
		},
		function(randomNounArray, randomTraslateArray, callback) {
			var resNounArray = [];
			if (null == randomTraslateArray) {
				for (var i = 0; i < randomNounArray.length; i++) {
					resNounArray.push({
						'word': randomNounArray[i]
					});
				}
				
			} else {
				if (randomNounArray.length != randomTraslateArray.length) {
					throw new Error('length isn\'t the same');
				}
				for (var i = 0; i < randomNounArray.length; i++) {
					resNounArray.push({
						'word': randomNounArray[i],
						'translate': randomTraslateArray[i]
					});
				}
			}
			res.json({
				'nouns': resNounArray
			});
		}
	], function(err, result) {
		//[TODO] if failed...
		console.log(result);
		console.log(err);
		console.log(Object.keys(err));

		throw err;
	});
});

app.listen(3000, function() {
	console.log('Started on PORT 3000');
})
