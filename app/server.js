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
	QuestionModel.find({username: req.query.username}, '-__v -username', function(err, questions) {
		var data = questions || [];
		res.json({
			'questions': questions
		});
	});
});

app.post('/api/questionAdd', function(req, res) {

	var question = new QuestionModel({
		question: req.body.question,
		username: req.body.username
	});
	question.save(function(err) {
		if (err) {
			console.log(err);
		}
	});

	res.end('done');
});

app.post('/api/questionEdit', function(req, res) {

	QuestionModel.findByIdAndUpdate(req.body.qid, {
		'question': req.body.question
	}, function(err) {
		if (err) {
			console.log('----- questionEdit -----');
			console.log(err);
		}
	});

	res.end('done');
});

app.get('/api/questionDelete', function(req, res) {

	QuestionModel.remove({_id: req.query.qid}, function(err) {
		if (err) {
			console.log('----- questionDelete -----');
			console.log(err);
		}
	});

	IdeaModel.remove({qid: req.query.qid}, function(err) {
		if (err) {
			console.log('----- questionDelete -----');
			console.log(err);
		}
	});

	res.end('done');
});

app.get('/api/ideaGet', function(req, res) {

	async.waterfall([
		function(callback) {
			IdeaModel.find({username: req.query.username}, '-__v -username', function(err, ideas) {
				var data = ideas || [];
				callback(err, data);
			}).lean();
		}, function(ideas, callback) {
			QuestionModel.find({username: req.query.username}, '-__v -username', function(err, questions) {
				var data = questions || [];
				callback(err, ideas, data);
			});
		}, function(ideas, questions, callback) {
			var questionHash = {};
			_.each(questions, function(element, idx) {
				questionHash[element._id] = element.question;
			});
			var normalizedIdeas = _.reject(ideas, function(element) {
				if (element.qid in questionHash) {
					return false;
				} else {
					return true;
				}
			});
			_.each(normalizedIdeas, function(element, idx) {
				element.qname = questionHash[element.qid];
				delete element.qid;
			});

			//Need prettified the nous
			_.each(normalizedIdeas, function(element, idx) {
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
			normalizedIdeas.sort(function(idea1, idea2) {
				return tools.strDateCompare(idea1.time, idea2.time);
			});
			res.json({'ideas': normalizedIdeas});
		}
	], function(err, result) {
		//[TODO] if failed...
		console.log(result);
		console.log(err);
		console.log(Object.keys(err));

		throw err;
	});

});

app.post('/api/ideaAdd', function(req, res) {

	var idea = new IdeaModel({
		idea: req.body.idea,
		qid: req.body.qid,
		nouns: JSON.stringify(req.body.nouns),
		time: moment().format(JSONENTRY_TIME_FORMAT),
		username: req.body.username
	});
	idea.save(function(err) {
		if (err) {
			console.log(err);
		}
	});

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
