const { User } = require('./userModel');

const TEST_CREATE_USER = false;
const TEST_USERNAME = 'a';
const TEST_PASSWORD = 'a';

const createUser = (username, password) => {
    if (TEST_CREATE_USER === false) {
        return;
    }
    // create a user a new user
    const testUser = new User({
        username,
        password,
    });

    // save user to database
    testUser.save((err) => {
        if (err) throw err;

        // fetch user and test password verification
        User.findOne({ username: TEST_USERNAME }, (errFindOne, user) => {
            if (errFindOne) throw errFindOne;

            // test a matching password
            user.comparePassword(TEST_PASSWORD, (errComparePW, isMatch) => {
                if (errComparePW) throw errComparePW;
                console.log(TEST_PASSWORD, ':', isMatch); // -> Password123: true
            });

            // test a failing password
            user.comparePassword('123Password', (errComparePW, isMatch) => {
                if (errComparePW) throw errComparePW;
                console.log('123Password:', isMatch); // -> 123Password: false
            });
        });
    });
};

createUser(TEST_USERNAME, TEST_PASSWORD);
