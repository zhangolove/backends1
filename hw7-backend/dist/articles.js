'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var db = require('./dbops');
var md5 = require('md5');
var ObjectId = require('mongoose').Types.ObjectId;

var getUniqueCommentId = function getUniqueCommentId(uid) {
	return (
		//This is a naive uuid generator
		md5(uid + new Date().getTime().toString())
	);
};

var getArticles = function getArticles(req, res) {
	var query = req.params.id;
	if (query) {
		var objId = new ObjectId(query.length < 12 ? '123456789012' : query);
		var filter = { $or: [{ _id: objId }, { author: query }] };
		db.findArticle(filter, function (articles) {
			res.send({ articles: articles });
		});
	} else {
		var username = req.username;
		db.getProfile(username, function (err, items) {
			var authors = items[0].following.concat(username);
			var filter = { author: { $in: authors } };
			db.findArticle(filter, function (articles) {
				res.send({ articles: articles });
			});
		});
	}
};

var addArticle = function addArticle(req, res) {

	if (!('text' in req.body)) {
		//The request is malformed
		return res.sendStatus(400);
	}

	var article = {
		author: req.username,
		text: req.body.text,
		date: new Date(),
		img: '',
		comments: []
	};
	db.saveArticle(article, function (_id) {
		res.send({ articles: [_extends({}, article, { _id: _id })] });
	});
};

var _replyUpdateArticle = function _replyUpdateArticle(res) {
	return function (err, article) {
		if (err) {
			res.status(404).send('Resource Not Found');
		} else {
			res.send({ articles: [article] });
		}
	};
};
var updateArticle = function updateArticle(req, res) {

	if (!('text' in req.body && 'id' in req.params)) {
		//The request is malformed
		return res.sendStatus(400);
	}
	var id = req.params.id;
	var text = req.body.text;
	if ('commentId' in req.body) {
		var commentId = req.body.commentId;
		if (commentId == -1) {
			//idicates the user want to add new comment
			db.addComment(id, {
				commentId: getUniqueCommentId(req.username),
				author: req.username,
				date: new Date(),
				text: text
			}, _replyUpdateArticle(res));
		} else {
			db.updateComment(id, commentId, { text: text }, _replyUpdateArticle(res));
		}
	} else {
		db.updateArticle(id, { text: text }, _replyUpdateArticle(res));
	}
};

module.exports = function (app, isLoggedIn) {
	app.get('/articles/:id*?', isLoggedIn, getArticles);
	app.put('/articles/:id', isLoggedIn, updateArticle);
	app.post('/article', isLoggedIn, addArticle);
};