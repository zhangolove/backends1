const md5 = require('md5')
const db = require('./dbops')
const cookieKey = 'sid'
const session = require('express-session')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy
const getSalt = () => new Date().toString()
const getHash = (p, s) => md5(p+s)
const redis = require('redis').createClient(process.env.REDIS_URL)
const scope = ['email', 'user_birthday']

let front_end_url
const fbOauthConfig = {
	clientID: process.env.APP_ID_FB,
	clientSecret: process.env.APP_SECRETE_FB,
	callbackURL: (process.env.PORT ? 
		process.env.APP_URL : 'http://localhost:3000') 
		+ '/auth/facebook/callback',
	profileFields: ['id', 'displayName', 'email', 'birthday']
}

passport.serializeUser((user, done) => done(null, user.id))

passport.deserializeUser((auth_fb, done) => 
	db.findOneUser({auth_fb}, user => done(null, user))
)

passport.use(new FacebookStrategy(fbOauthConfig,
  (accessToken, refreshToken, profile, done) => {
	const username = profile.displayName
	const auth_fb =  profile.id
	const dob = null
	const email = profile.email
	db.findOrCreateUser({username, auth_fb}, email, dob, () => {
		done(null, profile)
	})

  }
));

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
		if (users.length === 0) {
			res.sendStatus(401)
			return
		}
		const {salt, hash} = users[0]
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
	if (req.isAuthenticated()) {
		req.username = req.user.username
		next()
		return
	}

	if (!req.cookies || !req.cookies[cookieKey]) {
		return res.sendStatus(401)
	}
	redis.hgetall(req.cookies[cookieKey], (err, userObject) => {
		if (err || !userObject ||!userObject.username) {
			return res.sendStatus(401)
		}

		req.username = userObject.username
		next()
	})
}

const logout = (req, res) => {
	if (req.isAuthenticated()) {
        req.session.destroy()
        req.logout()
    } else {
		const sid = req.cookies[cookieKey]
		redis.del(sid)
		res.clearCookie(cookieKey)
	}
	res.status(200).send("OK")
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

const storeUrl = (req, res, next) => {
	if (!front_end_url) {
		front_end_url = req.headers.referer
	}
	next()
}

const redirectSuccess = (req,res) => {
	const username = req.user.displayName
	const sessionId = generateCode(username)
	redis.hmset(sessionId, {username})
	res.cookie(cookieKey, sessionId ,
        {maxAge: 3600000, httpOnly: true})
	res.redirect(front_end_url)

}
	


const redirectFailure = (err,req,res,next) => {
    if(err) {
        res.status(400).send({err: err.message})
    }
}

module.exports = (app) => {
	app.use(cookieParser())
	app.use(storeUrl)
	app.use(session({secret:'fasdfasdfasdfasdf'}))
	app.use(passport.initialize())
	app.use(passport.session())
	app.use('/login/facebook', 
			passport.authenticate('facebook', {scope}))
	app.use('/auth/facebook/callback', 
			passport.authenticate('facebook', 
				{failureRedirect:'/fail'}), redirectSuccess, redirectFailure)
	app.post('/register', register)
	app.post('/login', login)
	app.use(isLoggedIn)
	app.put('/logout', logout)
	app.put('/password', changePassword)
}
