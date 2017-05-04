import {Article, User, Profile} from './model.js'



export const findUser = (username, callback) => {
	User.find({username}).exec((err, users) => {
		callback(users)
	})
}
export const findOneUser = (query, callback) => {
	User.findOne(query).exec((err, user) => {
		callback(user)
	})
}

export const findOrCreateUser = (query, email, dob, cb) => {
	const {username} = query
	console.log(`findOrcreate ${username}`)
	User.findOne(query, (err, user) => {
		if (err || !user) {
			saveUser(query)
			saveProfile({username, email, dob, zipcode:null})
			console.log("created user")
		}
		console.log(user)
		cb()
	})

}
export const checkUserExists = (username, callback) => {
	findUser(username, (users) => {
		callback(users.length > 0)
	})
}

export const saveUser = user => {
	new User(user).save()
}

export const updatePassword = (username, update, callback) => {
	User.findOneAndUpdate({username}, {$set: update}, 
			(err, items) => callback(err))
}

export const saveProfile = user => {
	new Profile({...user, 
		headline: 'Please change this default headline',
		following: [],
		avatar: 'https://upload.wikimedia.org/' +
				'wikipedia/commons/c/c2/Cry-icon.png'
	}).save()
}

export const saveArticle = (article, callback) => {
	new Article(article).save((err, item) => {
		if (err) {
			console.log('Error: occurs in saveArticle')
		}
		console.log(`save article ${item}`)
		callback(item._id)
	})
}

export const findArticle = (query, callback, numEntry) => {

	let find = Article.find(query, {'__v':0}).sort({'date': -1})
	if (numEntry) {
		find = find.limit(numEntry)
	} 
	find.exec((err, items) => {
		if (err || items.length === 0) {
			//if no match, return all articles
			console.log('nomatch')
			console.log(items)
			Article.find().sort({'date':-1})
				.limit(numEntry).exec((err, items) => {
				callback(items)
			})
		} else {
			console.log(`query ${query} find articles ${items}`)
			callback(items)
		}
	})
}


export const updateArticle = (_id, update, callback) => {
	Article.findOneAndUpdate({_id},{$set:update}, 
								{new: true, fields: {'__v':0}})
		   .exec((err, doc) => {
			console.log(doc)
			callback(err, doc)
		})
}

export const _updateArticle = (_id, update, callback) => {
	Article.findOneAndUpdate({_id}, update, 
							{new: true, fields: {'__v':0}})
	       .exec(
				(err, doc) => {
					console.log(doc)
					callback(err, doc)
				})
}

export const updateComment = (_id, commentId, update, callback) => {
	Article.findOne({_id}).exec((err, article) => {
		console.log(article)
		if (err) {
			return callback(err)
		}
		const comments = article.toObject().comments
		console.log(`update comment ${comments}`)
		const notFound = comments.filter(c => commentId == c.commentId)
								 .length === 0					
		if (notFound) {
			console.log(`can't find commentId ${commentId}`)
			return callback(true)
		}

		const newComments = comments.map(c => 
			c.commentId == commentId ? {...c, ...update} : c)
		
		_updateArticle(_id, {$set: {comments: newComments}}, callback)

	})
}

export const addComment = (_id, addon, callback) => {
	const update = {$push: {comments: addon}}
	_updateArticle(_id, update, callback)
}

export const getAllProfile = (callback) => {
	Profile.find({}, (err, items) => callback(err, items))
}

export const getProfile = (username, callback) => {
	Profile.find({username}, (err, items) => callback(err, items))
}

export const updateProfile = (username, update, callback) => {
	Profile.findOneAndUpdate({username},update, 
							{new: true, fields: {'__v':0}})
		   .exec((err, doc) => {
			console.log(doc)
			callback(err, doc)
		})
}