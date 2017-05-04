import mongoose from 'mongoose' 
const url = process.env.MONGODB_URI
mongoose.connect(url)

///////////////////////////////////////////////////
mongoose.connection.on('connected', function() {
})
mongoose.connection.on('error', function(err) {
})
mongoose.connection.on('disconnected', function() {
})

process.once('SIGUSR2', function() {
	shutdown('nodemon restart', function() {
		process.kill(process.pid, 'SIGUSR2')
	})
})
process.on('SIGINT', function() {
	shutdown('app termination', function() {
		process.exit(0)
	})
})
process.on('SIGTERM', function() {
	shutdown('Heroku app shutdown', function() {
		process.exit(0)
	})
})
function shutdown(msg, callback) {
	mongoose.connection.close(function() {
		callback()
	})
}
///////////////////////////////////////////////////
