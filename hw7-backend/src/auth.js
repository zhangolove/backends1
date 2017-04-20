const md5 = require('md5')
const db = require('./dbops')
const cookieKey = 'sid'
const getSalt = () => new Date().toString()
const getHash = (p, s) => md5(p+s)
const redis = require('redis').createClient(process.env.REDIS_URL)


const generateCode = (username) => username + Math.random().toString()
const register = (req, res) => {
	const {username, email, dob, zipcode, password} = req.body
	if (!username || !password || !dob 
			|| !zipcode || !email) {
		res.sendStatus(400)
		return
	}


	db.checkUserExists(username, (exist) => {
		if (exist) {
			res.status(403)
			   .send('This username has been registered')
		} else {
			const salt = getSalt()
			const hash = getHash(password,salt)
			db.saveUser({username, salt, hash})
			db.saveProfile({username, email, dob, zipcode})
			res.send({result: 'success', username})
		}
	})
}


const login = (req, res) => {

	const username = req.body.username
	const password = req.body.password
	if (!username || !password) {
		res.sendStatus(400)
		return
	}

	db.findUser(username, (users) => {
		//console.log('users:' + users.length)
		if (users.length === 0) {
			res.sendStatus(401)
			return
		}
		const {salt, hash} = users[0]
		//console.log(`login password ${password}, 
					//length ${password.length}`)
		if (getHash(password,salt) !== hash) {
			res.sendStatus(401)
			return
		}
		const sessionId = generateCode(username)
		redis.hmset(sessionId, {username})
		res.cookie(cookieKey, sessionId ,
        	{maxAge: 3600000, httpOnly: true})
		res.send({username, result: 'success'})

	})

}

const isLoggedIn = (req, res, next) => {
	//console.log(req.cookies)
	if (!req.cookies || !req.cookies[cookieKey]) {
		//console.log("Login unsucceed, can't find cookie")
		return res.sendStatus(401)
	}
	redis.hgetall(req.cookies[cookieKey], (err, userObject) => {
		if (err || !userObject ||!userObject.username) {
			//console.log("Login unsucceed, can't find sid")
			return res.sendStatus(401)
		}
		//console.log("Login succeed")
		req.username = userObject.username
		next()
	})
}

const logout = (req, res) => {
	const sid = req.cookies[cookieKey]
	redis.del(sid)
	res.clearCookie(cookieKey)
	res.send('OK')
}

const changePassword = (req, res) => {
	const username = req.username
	const password = req.body.password
	if (!password) {
		return res.sendStatus(400)
	}
	const salt = getSalt()
	const hash = getHash(password,salt)
	db.updatePassword(username, {hash,salt}, (err) => {
		if (err) {
			res.sendStatus(404)
		} else {
			res.send({username, status: 'Success'})
		}
	})
}

module.exports = {
	isLoggedIn,
	auth: (app) => {
		app.post('/register', register)
		app.post('/login', login)
		app.put('/logout', isLoggedIn, logout)
		app.put('/password', isLoggedIn, changePassword)
	}
}