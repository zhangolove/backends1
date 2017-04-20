'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var uploadImage = require('./uploadCloudinary');
var db = require('./dbops');

var index = function index(req, res) {
	res.send({ hello: 'world' });
};

var _getFieldForMultipleUsers = function _getFieldForMultipleUsers(req, res, fields, field) {
	//console.log(req.params.users)
	var users = req.params.users ? req.params.users.split(',') : [req.username];
	//console.log(users)
	db.getProfile({ $in: users }, function (err, ps) {
		if (ps.length !== users.length) {
			return res.sendStatus(404);
		} else {
			var fieldList = ps.map(function (p) {
				var payload = { username: p.username };
				payload[field] = p[field];
				return payload;
			});
			var payload = {};
			payload[fields] = fieldList;
			res.send(payload);
		}
	});
};

var _getField = function _getField(req, res, field) {
	var username = req.params.user ? req.params.user : req.username;
	db.getProfile(username, function (err, p) {
		if (err || p.length === 0) {
			return res.sendStatus(404);
		}
		var payload = { username: username };
		payload[field] = p[0][field];
		res.send(payload);
	});
};

var _setField = function _setField(req, res, field, value) {
	var username = req.username;
	var update = {};
	update[field] = value ? value : req.body[field];
	if (!update[field]) {
		//check if the request is malformed
		return res.sendStatus(400);
	}
	db.updateProfile(username, { $set: update }, function (err, doc) {
		if (err) {
			return res.sendStatus(404);
		}
		//console.log(`_setField ${field} return value ${doc[field]}`)
		res.send(_extends({ username: username }, update));
	});
};

var getZipcode = function getZipcode(req, res) {
	return _getField(req, res, 'zipcode');
};

var getEmail = function getEmail(req, res) {
	return _getField(req, res, 'email');
};

var getDob = function getDob(req, res) {
	return _getField(req, res, 'dob');
};

var getFollowing = function getFollowing(req, res) {
	return _getField(req, res, 'following');
};

var getAvatars = function getAvatars(req, res) {
	return _getFieldForMultipleUsers(req, res, 'avatars', 'avatar');
};

var getHeadline = function getHeadline(req, res) {
	return _getFieldForMultipleUsers(req, res, 'headlines', 'headline');
};

var setHeadline = function setHeadline(req, res) {
	return _setField(req, res, 'headline');
};

var setZipcode = function setZipcode(req, res) {
	return _setField(req, res, 'zipcode');
};

var setEmail = function setEmail(req, res) {
	return _setField(req, res, 'email');
};

var setAvatar = function setAvatar(req, res) {
	return _setField(req, res, 'avatar', req.fileurl);
};

var _updateFollowing = function _updateFollowing(req, res, update, target) {
	var username = req.username;
	//allow to add to following only if target is in db
	db.checkUserExists(target, function (exist) {
		if (exist) {
			db.updateProfile(username, update, function (err, doc) {
				//TODO: CHECK IF ALREADY FOLLOWED
				if (err) {
					//console.log(err)
					return res.sendStatus(404);
				}
				res.send({ username: username, following: doc.following });
			});
		} else {
			//console.log("The following to update is not in my db")
			res.sendStatus(404);
		}
	});
};

var addFollowing = function addFollowing(req, res) {
	var target = req.params.user;
	var update = { $push: { following: target } };
	_updateFollowing(req, res, update, target);
};

var deleteFollowing = function deleteFollowing(req, res) {
	var target = req.params.user;
	var update = { $pullAll: { following: [target] } };
	_updateFollowing(req, res, update, target);
};

var uploadAvatar = function uploadAvatar(req, res, next) {
	uploadImage(req.username + '/avatar')(req, res, next);
};

module.exports = function (app, isLoggedIn) {
	app.get('/', index);
	app.get('/headlines/:users?', isLoggedIn, getHeadline);
	app.put('/headline', isLoggedIn, setHeadline);
	app.get('/dob', isLoggedIn, getDob);
	app.get('/zipcode/:user?', isLoggedIn, getZipcode);
	app.put('/zipcode', isLoggedIn, setZipcode);
	app.get('/email/:user?', isLoggedIn, getEmail);
	app.put('/email', isLoggedIn, setEmail);
	app.get('/avatars/:users?', isLoggedIn, getAvatars);
	app.put('/avatar', isLoggedIn, uploadAvatar, setAvatar);
	app.get('/following/:user?', isLoggedIn, getFollowing);
	app.put('/following/:user', isLoggedIn, addFollowing);
	app.delete('/following/:user', isLoggedIn, deleteFollowing);
};