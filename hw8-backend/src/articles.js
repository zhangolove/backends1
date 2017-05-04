const db = require('./dbops')
const md5 = require('md5')
const ObjectId = require('mongoose').Types.ObjectId
const uploadImage = require('./uploadCloudinary')

const getUniqueCommentId = (uid) => 
	//This is a naive uuid generator
		md5(uid + new Date().getTime().toString())

const getArticles = (req, res) => {
	const query = req.params.id
	if (query) {
		const objId = new ObjectId((query.length < 12) ? 
								'123456789012' : query )
		const filter = {$or:[ {_id: objId}, {author:query}]}
		db.findArticle(filter, (articles) => {
			res.send({ articles })
		})
	} else {
		const username = req.username
		db.getProfile(username, (err, items) => {
			const authors = items[0].following.concat(username)
			const filter = {author: {$in: authors}}
			db.findArticle(filter, (articles) => {
				res.send({ articles })
			}, 10)
		})
	}
}

const prcessImage = (req, res, next) => {
	uploadImage(`${req.username}/article/${new Date().toString()}`)(req,res,next)
}

const addArticle = (req, res) => {
	
	if (!('text' in req.body)) {
		//The request is malformed
		return res.sendStatus(400)
	}
	
	const article = {
		author: req.username,
		text: req.body.text,
		date: new Date(),
		img: req.fileurl,
		comments: []
	}	
	db.saveArticle(article, (_id) => {
		res.send({ articles: [ {...article, _id} ] })
	})
}


const _replyUpdateArticle =  (res) => (err, article) => {
	if (err) {
		res.status(404).send('Resource Not Found')
	} else {
		res.send({articles: [article]})
	}
}
const updateArticle = (req, res) => {
	
	if (!('text' in req.body && 'id' in req.params)) {
		//The request is malformed
		return res.sendStatus(400)
	}
	const id = req.params.id
	const text = req.body.text
	if ('commentId' in req.body) {
		const commentId = req.body.commentId
		if (commentId == -1) {
			//idicates the user want to add new comment
			db.addComment(id, {
				commentId: getUniqueCommentId(req.username),
				author: req.username,
				date: new Date(),
				text
			}, _replyUpdateArticle(res))
		}else {
			db.updateComment(id, commentId, 
					{text}, _replyUpdateArticle(res))
		}
	} else {
		db.updateArticle(id, {text}, _replyUpdateArticle(res))
	}
}

module.exports = (app) => {
	app.get('/articles/:id*?', getArticles)
	app.put('/articles/:id', updateArticle)
	app.post('/article', prcessImage, addArticle)
}
