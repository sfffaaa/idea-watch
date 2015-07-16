var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var	SALT_WORK_FACTOR = 10;
var MANGODB_URL = 'mongodb://localhost:27017';
var MANGODB_USER_DB = 'app-idea-db';

var userConn = mongoose.createConnection(MANGODB_URL + '/' + MANGODB_USER_DB, function(err) {
	if (err) {
		throw err;
	}
	console.log('Successfully connected to MongoDB');
});

var userSchema = new mongoose.Schema({
	username: {type: String, required: true},
	password: {type: String, required: true}
});

userSchema.pre('save', function(next) {
	var user = this;

	// only hash the password if it has been modified (or is new)
	if (!user.isModified('password')) {
		return next();
	}

	// generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if (err) {
			return next(err);
		}

		// hash the password using our new salt
		bcrypt.hash(user.password, salt, function(err, hash) {
			if (err) {
				return next(err);
			}

			// override the cleartext password with the hashed one
			user.password = hash;
			next();
		});
	});
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if (err) {
			return cb(err);
		}
		cb(err, isMatch);
	});
};

var ideaSchema = new mongoose.Schema({
	idea: {type: String, required: true},
	nouns: {type: String, required: true},
	qid: {type: String, required: true},
	time: {type: Date, required: true},
	username: {type: String, required: true}
});

var observeSchema = new mongoose.Schema({
	observe: {type: String, required: true},
	time: {type: Date, required: true},
	username: {type: String, required: true}
});

var questionSchema = new mongoose.Schema({
	question: {type: String, required: true},
	username: {type: String, required: true}
});

module.exports = {
	User: userConn.model('User', userSchema),
	Idea: userConn.model('Idea', ideaSchema),
	Observe: userConn.model('Observe', observeSchema),
	Question: userConn.model('Question', questionSchema)
}
