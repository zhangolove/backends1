'use strict';

var md5 = require('md5');
var db = require('./dbops');
var cookieKey = 'sid';
var getSalt = function getSalt() {
	return new Date().toString();
};
var getHash = function getHash(p, s) {
	return md5(p + s);
};
var redis = require('redis').createClient(process.env.REDIS_URL);

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
		//console.log('users:' + users.length)
		if (users.length === 0) {
			res.sendStatus(401);
			return;
		}
		var _users$ = users[0],
		    salt = _users$.salt,
		    hash = _users$.hash;
		//console.log(`login password ${password}, 
		//length ${password.length}`)

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
	//console.log(req.cookies)
	if (!req.cookies || !req.cookies[cookieKey]) {
		//console.log("Login unsucceed, can't find cookie")
		return res.sendStatus(401);
	}
	redis.hgetall(req.cookies[cookieKey], function (err, userObject) {
		if (err || !userObject || !userObject.username) {
			//console.log("Login unsucceed, can't find sid")
			return res.sendStatus(401);
		}
		//console.log("Login succeed")
		req.username = userObject.username;
		next();
	});
};

var logout = function logout(req, res) {
	var sid = req.cookies[cookieKey];
	redis.del(sid);
	res.clearCookie(cookieKey);
	res.send('OK');
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

module.exports = {
	isLoggedIn: isLoggedIn,
	auth: function auth(app) {
		app.post('/register', register);
		app.post('/login', login);
		app.put('/logout', isLoggedIn, logout);
		app.put('/password', isLoggedIn, changePassword);
	}
};