var User = require('./userModel');

var TEST_CREATE_USER = false;
var TEST_USERNAME = 'TESTAA';
var TEST_PASSWORD = 'TESTAA';

var createUser = function(username, password) {

	if (false == TEST_CREATE_USER) {
		return;
	}
	// create a user a new user
	var testUser = new User({
		username: username,
		password: password
	});

	// save user to database
	testUser.save(function(err) {
		if (err) throw err;

		// fetch user and test password verification
		User.findOne({ username: TEST_USERNAME }, function(err, user) {
			if (err) throw err;

			// test a matching password
			user.comparePassword(TEST_PASSWORD, function(err, isMatch) {
				if (err) throw err;
				console.log(TEST_PASSWORD, ':', isMatch); // -> Password123: true
			});

			// test a failing password
			user.comparePassword('123Password', function(err, isMatch) {
				if (err) throw err;
				console.log('123Password:', isMatch); // -> 123Password: false
			});
		});
	});
}

createUser(TEST_USERNAME, TEST_PASSWORD);
