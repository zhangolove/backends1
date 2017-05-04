const uploadImage = require('./uploadCloudinary')
const db = require('./dbops')



const index = (req, res) => {
	res.send({ hello: 'world' })
}

const _getFieldForMultipleUsers = (req, res, fields, field) => {
	const users = req.params.users ? 
			req.params.users.split(',') : [req.username]
    
	db.getProfile({$in: users}, (err, ps) => {
		
		if (ps.length !== users.length) {
			return res.sendStatus(404)
		} else {
			const fieldList = ps.map(p => {
				const payload = {username: p.username}
				payload[field] = p[field]
				return payload
			})
			const payload = {}
			payload[fields] = fieldList
			res.send(payload)
		}
	})

}


const _getField = (req, res, field) => {
	const username = req.params.user ? req.params.user : req.username
	db.getProfile(username, (err, p) => {
		if (err || p.length === 0) {
			return res.sendStatus(404)
		}
		const payload = {username}
		payload[field] = p[0][field]
		res.send(payload)
	})
}


const _setField = (req, res, field, value) => {
	const username = req.username
	const update = {}
	update[field] = value ? value : req.body[field]
	if (!update[field]) {
		//check if the request is malformed
		return res.sendStatus(400)
	}
	db.updateProfile(username, {$set:update}, (err, doc) => {
		if (err) {
			return res.sendStatus(404)
		}
		res.send({username, ...update})
	})
	
}

const getZipcode = (req, res) => 
	_getField(req, res, 'zipcode')

const getEmail = (req, res) => 
	_getField(req, res, 'email')

const getDob = (req, res) => 
	_getField(req, res, 'dob')

const getFollowing = (req, res) => 
	_getField(req, res, 'following')

const getAvatars = (req, res) => 
	_getFieldForMultipleUsers(req, res, 'avatars', 'avatar')

const getHeadline = (req, res) => 
	_getFieldForMultipleUsers(req, res, 'headlines', 'headline')

const setHeadline = (req, res) => 
	_setField(req, res, 'headline')

const setZipcode = (req, res) => 
	_setField(req, res, 'zipcode')

const setEmail = (req, res) => 
	_setField(req, res, 'email')

const setAvatar = (req, res) => 
	_setField(req, res, 'avatar', req.fileurl)

const _updateFollowing = (req, res, update, target) => {
	const username = req.username
	//allow to add to following only if target is in db
	db.checkUserExists(target, (exist) => {
		if (exist) {
			db.updateProfile(username, update, (err, doc) => {
				//TODO: CHECK IF ALREADY FOLLOWED
				if (err) {
					return res.sendStatus(404)
				}
				res.send({username, following: doc.following})
			})
		} else {
			res.sendStatus(404)
		}
	})
	
}

const addFollowing = (req, res) => {
	const target = req.params.user
	const update = {$push: {following: target}}
	_updateFollowing(req, res, update, target)
}

const deleteFollowing = (req, res) => {
	const target = req.params.user
	const update = {$pullAll: {following: [target]}}
	_updateFollowing(req, res, update, target)
}

const uploadAvatar = (req, res, next) => {
	uploadImage(`${req.username}/avatar`)(req,res,next)
}

module.exports = (app) => {
	app.get('/', index)
	app.get('/headlines/:users?', getHeadline)
	app.put('/headline', setHeadline)
	app.get('/dob', getDob)
	app.get('/zipcode/:user?', getZipcode)
	app.put('/zipcode', setZipcode)
	app.get('/email/:user?', getEmail)
	app.put('/email', setEmail)
	app.get('/avatars/:users?', getAvatars)
	app.put('/avatar', uploadAvatar, setAvatar)
	app.get('/following/:user?', getFollowing)
	app.put('/following/:user', addFollowing)
	app.delete('/following/:user', deleteFollowing)
}