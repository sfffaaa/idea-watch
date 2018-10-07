/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const moment = require('moment');
const { _ } = require('underscore');
const util = require('util');
const PythonShell = require('python-shell');
const async = require('async');
const path = require('path');

const tools = require('./tools');
const UserModel = require('./userModel').User;
const QuestionModel = require('./userModel').Question;
const IdeaModel = require('./userModel').Idea;
const ObserveModel = require('./userModel').Observe;
const sailsTokenAuth = require('./sailsTokenAuth');

const app = express();

// Test user
require('./userTest');

const JSONENTRY_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const RANDOM_NOUN_DEFAULT_SIZE = 3;

const logFile = fs.createWriteStream(path.join(__dirname, '/debug.log'), { flags: 'w' });
const logStdout = process.stdout;

console.log = (d) => {
    logFile.write(`${util.format(d)}\n`);
    logStdout.write(`${util.format(d)}\n`);
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname));

app.set('views', path.join(__dirname, 'app'));
app.set('view engine', 'jade');

app.get('/', (req, res) => {
    res.sendFile('app/index.html', { root: __dirname });
});

app.post('/api/login', (req, res) => {
    const decData = JSON.parse(
        Buffer.from(req.body.enc_data, 'base64').toString(),
    );
    const username = decData.username || '';
    const password = decData.password || '';

    if (username === '' || password === '') {
        res.sendStatus(401);
        return;
    }

    UserModel.findOne({ username }, (err, user) => {
        if (err || user === null) {
            res.sendStatus(401);
            return;
        }

        user.comparePassword(password, (errCompare, isMatch) => {
            if (err || !isMatch) {
                console.log(`Attempt failed to login with ${user.username}`);
                res.sendStatus(401);
                return;
            }

            res.json({
                success: true,
                user: user.username,
                token: sailsTokenAuth.issueToken(user.id),
            });
        });
    });
});

app.use(sailsTokenAuth.tokenAuth);

app.get('/api/questionGet', (req, res) => {
    QuestionModel.find({ username: req.query.username }, '-__v -username', (err, questions) => {
        const data = questions || [];
        res.json({
            success: true,
            questions: data,
        });
    });
});

app.post('/api/questionAdd', (req, res) => {
    const question = new QuestionModel({
        question: req.body.question,
        username: req.body.username,
    });
    question.save((err) => {
        if (err) {
            console.log(err);
            res.json({ success: false });
        } else {
            res.json({ success: true });
        }
    });
});

app.post('/api/questionEdit', (req, res) => {
    QuestionModel.findByIdAndUpdate(req.body.qid, {
        question: req.body.question,
    }, (err) => {
        if (err) {
            console.log('----- questionEdit -----');
            console.log(err);
            res.json({ success: false });
        } else {
            res.json({ success: true });
        }
    });
});

app.get('/api/questionDelete', (req, res) => {
    QuestionModel.remove({ _id: req.query.qid }, (err) => {
        if (err) {
            console.log('----- questionDelete -----');
            console.log(err);
        }
    });

    IdeaModel.remove({ qid: req.query.qid }, (err) => {
        if (err) {
            console.log('----- questionDelete -----');
            console.log(err);
        }
    });

    res.json({ success: true });
});

app.get('/api/ideaGet', (req, res) => {
    async.waterfall([
        (callback) => {
            IdeaModel.find({ username: req.query.username }, '-__v -username', (err, ideas) => {
                const data = ideas || [];
                callback(err, data);
            }).lean();
        }, (ideas, callback) => {
            QuestionModel.find({ username: req.query.username }, '-__v -username', (err, questions) => {
                const data = questions || [];
                callback(err, ideas, data);
            });
        }, (ideas, questions, callback) => {
            const questionHash = {};
            _.each(questions, (element) => {
                questionHash[element._id] = element.question;
            });
            const normalizedIdeas = _.reject(ideas, (element) => {
                if (element.qid in questionHash) {
                    return false;
                }
                return true;
            });
            _.each(normalizedIdeas, (element) => {
                element.qname = questionHash[element.qid]; // eslint-disable-line no-param-reassign
                delete element.qid; // eslint-disable-line no-param-reassign
            });

            // Need prettified the nous
            _.each(normalizedIdeas, (element) => {
                if (element.nouns == null) {
                    return;
                }
                const nounArray = [];
                const nouns = JSON.parse(element.nouns);
                _.each(nouns, (nounElem) => {
                    if (nounElem.translate != null) {
                        nounArray.push(util.format('%s(%s)', nounElem.word, nounElem.translate));
                    } else {
                        nounArray.push(util.format('%s', nounElem.word));
                    }
                });
                element.nouns = nounArray.join(', '); // eslint-disable-line no-param-reassign
            });

            // Need resorted the json by time
            normalizedIdeas.sort((idea1, idea2) => tools.strDateCompare(idea1.time, idea2.time));
            callback(normalizedIdeas);
        },
    ], (err, result) => {
        if (err) {
            console.log(err);
            console.log(Object.keys(err));
            res.json({ success: false });
        } else {
            res.json({
                success: true,
                ideas: result,
            });
        }
    });
});

app.post('/api/ideaAdd', (req, res) => {
    const idea = new IdeaModel({
        idea: req.body.idea,
        qid: req.body.qid,
        nouns: JSON.stringify(req.body.nouns),
        time: moment().format(JSONENTRY_TIME_FORMAT),
        username: req.body.username,
    });
    idea.save((err) => {
        if (err) {
            console.log(err);
            res.json({ success: false });
        } else {
            res.json({ success: true });
        }
    });
});

app.get('/api/observeGet', (req, res) => {
    ObserveModel.find({ username: req.query.username }, '-__v -username', (err, observe) => {
        const data = observe || [];

        res.json({
            success: true,
            observes: data,
        });
    });
});

app.post('/api/observeAdd', (req, res) => {
    const observe = new ObserveModel({
        observe: req.body.observe,
        time: moment().format(JSONENTRY_TIME_FORMAT),
        username: req.body.username,
    });
    observe.save((err) => {
        if (err) {
            console.log(err);
            res.json({ success: false });
        } else {
            res.json({ success: true });
        }
    });
});

app.get('/api/randomNounGet', (req, res) => {
    const nounSize = req.query.nounSize || RANDOM_NOUN_DEFAULT_SIZE;
    // const isNeedTranslate = req.query.isNeedTranslate || true;

    const processRawNounsToRandomArray = (rawNounsData) => {
        const nounArray = rawNounsData.toString().split('\n');
        const randomNounArray = [];
        for (let i = 0; i < nounSize; i += 1) {
            const randomIdx = Math.floor(Math.random() * nounArray.length);
            randomNounArray.push(nounArray[randomIdx]);
        }
        return randomNounArray;
    };
    const processRawTranslateToRandomTranslateArray = function jsonParse(rawTranslateData) {
        return JSON.parse(rawTranslateData);
    };

    async.waterfall([
        (callback) => {
            fs.readFile('./data/words', (err, data) => {
                if (err) {
                    throw err;
                }
                const randomNounArray = processRawNounsToRandomArray(data);
                callback(err, randomNounArray);
            });
        },
        (randomNounArray, callback) => {
            const options = {
                mode: 'text',
                pythonPath: '/usr/bin/python',
                scriptPath: './script',
                args: randomNounArray,
            };
            PythonShell.run('translate.py', options, (err, results) => {
                // Setup the results
                let randomTraslateArray = null;
                if (results != null) {
                    randomTraslateArray = processRawTranslateToRandomTranslateArray(results);
                }
                callback(err, randomNounArray, randomTraslateArray);
            });
        },
        (randomNounArray, randomTraslateArray, callback) => {
            const resNounArray = [];
            if (randomTraslateArray == null) {
                for (let i = 0; i < randomNounArray.length; i += 1) {
                    resNounArray.push({
                        word: randomNounArray[i],
                    });
                }
            } else {
                if (randomNounArray.length !== randomTraslateArray.length) {
                    throw new Error('length isn\'t the same');
                }
                for (let i = 0; i < randomNounArray.length; i += 1) {
                    if (randomNounArray[i] !== randomTraslateArray[i]) {
                        resNounArray.push({
                            word: randomNounArray[i],
                            translate: randomTraslateArray[i],
                        });
                    } else {
                        resNounArray.push({
                            word: randomNounArray[i],
                            translate: '?',
                        });
                    }
                }
            }
            callback(resNounArray);
        },
    ], (err, result) => {
        // [TODO] if failed...
        if (err) {
            console.log(err);
            console.log(Object.keys(err));
            res.json({ success: false });
        } else {
            console.log(result);
            res.json({
                success: true,
                nouns: result,
            });
        }
    });
});

app.listen(30127, () => {
    console.log('Started on PORT 30127');
});
