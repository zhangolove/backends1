'use strict';

var following = ['cl46', 'cl46test', 'guest'];

var getFollowing = function getFollowing(req, res) {
	var username = req.params.user ? req.params.user : 'guest';
	res.send({ username: username, following: following });
};

var putFollowing = function putFollowing(req, res) {
	var username = 'guest';
	res.send({ username: username,
		following: following.concat([req.params.user]) });
};

var deleteFollowing = function deleteFollowing(req, res) {
	var username = 'guest';
	res.send({ username: username,
		following: following.filter(function (f) {
			return f !== req.params.user;
		}) });
};

module.exports = function (app) {
	app.get('/following/:user?', getFollowing);
	app.route('/following/:user').put(putFollowing).delete(deleteFollowing);
};