'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.updateProfile = exports.getProfile = exports.getAllProfile = exports.addComment = exports.updateComment = exports._updateArticle = exports.updateArticle = exports.findArticle = exports.saveArticle = exports.saveProfile = exports.updatePassword = exports.saveUser = exports.checkUserExists = exports.findOrCreateUser = exports.findOneUser = exports.findUser = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _model = require('./model.js');

var findUser = exports.findUser = function findUser(username, callback) {
	_model.User.find({ username: username }).exec(function (err, users) {
		callback(users);
	});
};
var findOneUser = exports.findOneUser = function findOneUser(query, callback) {
	_model.User.findOne(query).exec(function (err, user) {
		callback(user);
	});
};

var findOrCreateUser = exports.findOrCreateUser = function findOrCreateUser(query, email, dob, cb) {
	var username = query.username;

	console.log('findOrcreate ' + username);
	_model.User.findOne(query, function (err, user) {
		if (err || !user) {
			saveUser(query);
			saveProfile({ username: username, email: email, dob: dob, zipcode: null });
			console.log("created user");
		}
		console.log(user);
		cb();
	});
};
var checkUserExists = exports.checkUserExists = function checkUserExists(username, callback) {
	findUser(username, function (users) {
		callback(users.length > 0);
	});
};

var saveUser = exports.saveUser = function saveUser(user) {
	new _model.User(user).save();
};

var updatePassword = exports.updatePassword = function updatePassword(username, update, callback) {
	_model.User.findOneAndUpdate({ username: username }, { $set: update }, function (err, items) {
		return callback(err);
	});
};

var saveProfile = exports.saveProfile = function saveProfile(user) {
	new _model.Profile(_extends({}, user, {
		headline: 'Please change this default headline',
		following: [],
		avatar: 'https://upload.wikimedia.org/' + 'wikipedia/commons/c/c2/Cry-icon.png'
	})).save();
};

var saveArticle = exports.saveArticle = function saveArticle(article, callback) {
	new _model.Article(article).save(function (err, item) {
		if (err) {
			console.log('Error: occurs in saveArticle');
		}
		console.log('save article ' + item);
		callback(item._id);
	});
};

var findArticle = exports.findArticle = function findArticle(query, callback, numEntry) {

	var find = _model.Article.find(query, { '__v': 0 }).sort({ 'date': -1 });
	if (numEntry) {
		find = find.limit(numEntry);
	}
	find.exec(function (err, items) {
		if (err || items.length === 0) {
			//if no match, return all articles
			console.log('nomatch');
			console.log(items);
			_model.Article.find().sort({ 'date': -1 }).limit(numEntry).exec(function (err, items) {
				callback(items);
			});
		} else {
			console.log('query ' + query + ' find articles ' + items);
			callback(items);
		}
	});
};

var updateArticle = exports.updateArticle = function updateArticle(_id, update, callback) {
	_model.Article.findOneAndUpdate({ _id: _id }, { $set: update }, { new: true, fields: { '__v': 0 } }).exec(function (err, doc) {
		console.log(doc);
		callback(err, doc);
	});
};

var _updateArticle = exports._updateArticle = function _updateArticle(_id, update, callback) {
	_model.Article.findOneAndUpdate({ _id: _id }, update, { new: true, fields: { '__v': 0 } }).exec(function (err, doc) {
		console.log(doc);
		callback(err, doc);
	});
};

var updateComment = exports.updateComment = function updateComment(_id, commentId, update, callback) {
	_model.Article.findOne({ _id: _id }).exec(function (err, article) {
		console.log(article);
		if (err) {
			return callback(err);
		}
		var comments = article.toObject().comments;
		console.log('update comment ' + comments);
		var notFound = comments.filter(function (c) {
			return commentId == c.commentId;
		}).length === 0;
		if (notFound) {
			console.log('can\'t find commentId ' + commentId);
			return callback(true);
		}

		var newComments = comments.map(function (c) {
			return c.commentId == commentId ? _extends({}, c, update) : c;
		});

		_updateArticle(_id, { $set: { comments: newComments } }, callback);
	});
};

var addComment = exports.addComment = function addComment(_id, addon, callback) {
	var update = { $push: { comments: addon } };
	_updateArticle(_id, update, callback);
};

var getAllProfile = exports.getAllProfile = function getAllProfile(callback) {
	_model.Profile.find({}, function (err, items) {
		return callback(err, items);
	});
};

var getProfile = exports.getProfile = function getProfile(username, callback) {
	_model.Profile.find({ username: username }, function (err, items) {
		return callback(err, items);
	});
};

var updateProfile = exports.updateProfile = function updateProfile(username, update, callback) {
	_model.Profile.findOneAndUpdate({ username: username }, update, { new: true, fields: { '__v': 0 } }).exec(function (err, doc) {
		console.log(doc);
		callback(err, doc);
	});
};