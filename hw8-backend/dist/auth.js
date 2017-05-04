'use strict';

var md5 = require('md5');
var db = require('./dbops');
var cookieKey = 'sid';
var session = require('express-session');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var getSalt = function getSalt() {
	return new Date().toString();
};
var getHash = function getHash(p, s) {
	return md5(p + s);
};
var redis = require('redis').createClient(process.env.REDIS_URL);
var scope = ['email', 'user_birthday'];

var front_end_url = void 0;
var fbOauthConfig = {
	clientID: process.env.APP_ID_FB,
	clientSecret: process.env.APP_SECRETE_FB,
	callbackURL: (process.env.PORT ? process.env.APP_URL : 'http://localhost:3000') + '/auth/facebook/callback',
	profileFields: ['id', 'displayName', 'email', 'birthday']
};

// passport.serializeUser((user, done) => done(null, user.id))

// passport.deserializeUser((auth_fb, done) => 
// 	db.findOneUser({auth_fb}, user => done(null, user))
// )

// passport.use(new FacebookStrategy(fbOauthConfig,
//   (accessToken, refreshToken, profile, done) => {
// 	const username = profile.displayName
// 	const auth_fb =  profile.id
// 	const dob = null
// 	const email = profile.email
// 	db.findOrCreateUser({username, auth_fb}, email, dob, () => {
// 		done(null, profile)
// 	})

//   }
// ));

var generateCode = function generateCode(username) {
	return username + Math.random().toString();
};
var register = function register(req, res) {
	var _req$body = req.body,
	    username = _req$body.username,
	    email = _req$body.email,
	    dob = _req$body.dob,
	    zipcode = _req$body.zipcode,
	    password = _req$body.password;

	if (!username || !password || !dob || !zipcode || !email) {
		res.sendStatus(400);
		return;
	}

	db.checkUserExists(username, function (exist) {
		if (exist) {
			res.status(403).send('This username has been registered');
		} else {
			var salt = getSalt();
			var hash = getHash(password, salt);
			db.saveUser({ username: username, salt: salt, hash: hash });
			db.saveProfile({ username: username, email: email, dob: dob, zipcode: zipcode });
			res.send({ result: 'success', username: username });
		}
	});
};

var login = function login(req, res) {

	var username = req.body.username;
	var password = req.body.password;
	if (!username || !password) {
		res.sendStatus(400);
		return;
	}

	db.findUser(username, function (users) {
		if (users.length === 0) {
			res.sendStatus(401);
			return;
		}
		var _users$ = users[0],
		    salt = _users$.salt,
		    hash = _users$.hash;

		if (getHash(password, salt) !== hash) {
			res.sendStatus(401);
			return;
		}
		var sessionId = generateCode(username);
		redis.hmset(sessionId, { username: username });
		res.cookie(cookieKey, sessionId, { maxAge: 3600000, httpOnly: true });
		res.send({ username: username, result: 'success' });
	});
};

var isLoggedIn = function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		req.username = req.user.username;
		next();
		return;
	}

	if (!req.cookies || !req.cookies[cookieKey]) {
		return res.sendStatus(401);
	}
	redis.hgetall(req.cookies[cookieKey], function (err, userObject) {
		if (err || !userObject || !userObject.username) {
			return res.sendStatus(401);
		}

		req.username = userObject.username;
		next();
	});
};

var logout = function logout(req, res) {
	if (req.isAuthenticated()) {
		req.session.destroy();
		req.logout();
	} else {
		var sid = req.cookies[cookieKey];
		redis.del(sid);
		res.clearCookie(cookieKey);
	}
	res.status(200).send("OK");
};

var changePassword = function changePassword(req, res) {
	var username = req.username;
	var password = req.body.password;
	if (!password) {
		return res.sendStatus(400);
	}
	var salt = getSalt();
	var hash = getHash(password, salt);
	db.updatePassword(username, { hash: hash, salt: salt }, function (err) {
		if (err) {
			res.sendStatus(404);
		} else {
			res.send({ username: username, status: 'Success' });
		}
	});
};

var storeUrl = function storeUrl(req, res, next) {
	if (!front_end_url) {
		front_end_url = req.headers.referer;
	}
	next();
};

var redirectSuccess = function redirectSuccess(req, res) {
	var username = req.user.displayName;
	var sessionId = generateCode(username);
	redis.hmset(sessionId, { username: username });
	res.cookie(cookieKey, sessionId, { maxAge: 3600000, httpOnly: true });
	res.redirect(front_end_url);
};

var redirectFailure = function redirectFailure(err, req, res, next) {
	if (err) {
		res.status(400).send({ err: err.message });
	}
};

module.exports = function (app) {
	app.use(cookieParser());
	app.use(storeUrl);
	app.use(session({ secret: 'fasdfasdfasdfasdf' }));
	//app.use(passport.initialize())
	//app.use(passport.session())
	// app.use('/login/facebook', 
	// 		passport.authenticate('facebook', {scope}))
	// app.use('/auth/facebook/callback', 
	// 		passport.authenticate('facebook', 
	// 			{failureRedirect:'/fail'}), redirectSuccess, redirectFailure)
	app.post('/register', register);
	app.post('/login', login);
	app.use(isLoggedIn);
	app.put('/logout', logout);
	app.put('/password', changePassword);
};