'use strict';

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var url = process.env.MONGODB_URI;
_mongoose2.default.connect(url);

///////////////////////////////////////////////////
_mongoose2.default.connection.on('connected', function () {});
_mongoose2.default.connection.on('error', function (err) {});
_mongoose2.default.connection.on('disconnected', function () {});

process.once('SIGUSR2', function () {
	shutdown('nodemon restart', function () {
		process.kill(process.pid, 'SIGUSR2');
	});
});
process.on('SIGINT', function () {
	shutdown('app termination', function () {
		process.exit(0);
	});
});
process.on('SIGTERM', function () {
	shutdown('Heroku app shutdown', function () {
		process.exit(0);
	});
});
function shutdown(msg, callback) {
	_mongoose2.default.connection.close(function () {
		callback();
	});
}
///////////////////////////////////////////////////