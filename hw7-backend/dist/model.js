'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Profile = exports.User = exports.Article = undefined;

require('./db.js');

// this is model.js 

var mongoose = require('mongoose');


var commentSchema = new mongoose.Schema({
	commentId: String, author: String, date: Date, text: String
}, { _id: false });
var articleSchema = new mongoose.Schema({
	author: String, img: String, date: Date, text: String,
	comments: [commentSchema]
});

var userSchema = new mongoose.Schema({
	username: String, salt: String, hash: String
});

var profileSchema = new mongoose.Schema({
	username: String, headline: String, following: [String],
	email: String, zipcode: String, avatar: String, dob: Date
});

var Article = exports.Article = mongoose.model('articles', articleSchema);
var User = exports.User = mongoose.model('users', userSchema);
var Profile = exports.Profile = mongoose.model('profiles', profileSchema);

//Article.remove({}, err=>console.log(err))