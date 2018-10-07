const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const SALT_WORK_FACTOR = 10;
const MANGODB_URL = 'mongodb://localhost:27017';
const MANGODB_USER_DB = 'app-idea-db';

const userConn = mongoose.createConnection(`${MANGODB_URL}/${MANGODB_USER_DB}`, (err) => {
    if (err) {
        throw err;
    }
    console.log('Successfully connected to MongoDB');
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
});

userSchema.pre('save', (next) => {
    const user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) {
        next();
        return;
    }

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
        if (err) {
            next(err);
            return;
        }

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, null, (errHash, hash) => {
            if (errHash) {
                return next(errHash);
            }

            // override the cleartext password with the hashed one
            user.password = hash;
            return next();
        });
    });
});

userSchema.methods.comparePassword = (candidatePassword, cb) => {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        if (err) {
            return cb(err);
        }
        return cb(err, isMatch);
    });
};

const ideaSchema = new mongoose.Schema({
    idea: { type: String, required: true },
    nouns: { type: String, required: true },
    qid: { type: String, required: true },
    time: { type: Date, required: true },
    username: { type: String, required: true },
});

const observeSchema = new mongoose.Schema({
    observe: { type: String, required: true },
    time: { type: Date, required: true },
    username: { type: String, required: true },
});

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    username: { type: String, required: true },
});

module.exports = {
    User: userConn.model('User', userSchema),
    Idea: userConn.model('Idea', ideaSchema),
    Observe: userConn.model('Observe', observeSchema),
    Question: userConn.model('Question', questionSchema),
};
