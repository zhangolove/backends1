'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').load();
}

var cors = function cors(req, res, next) {
	res.header('Access-Control-Allow-Origin', req.headers.origin);
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With,\
									 Content-Type, Accept');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	if (req.method === 'OPTIONS') {
		res.status(200).send('OK');
	} else {
		next();
	}
};
var app = express();
app.use(logger('default'));
app.use(bodyParser.json());
app.use(cors);

var _require = require('./auth'),
    isLoggedIn = _require.isLoggedIn,
    auth = _require.auth;

var cookieParser = require('cookie-parser');
app.use(cookieParser());
auth(app);
require('./articles.js')(app, isLoggedIn);
require('./profile.js')(app, isLoggedIn);

// Get the port from the environment, i.e., Heroku sets it
var port = process.env.PORT || 3000;
app.listen(port, function () {});