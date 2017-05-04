// this is model.js 

const mongoose = require('mongoose')
import './db.js'

const commentSchema = new mongoose.Schema({
	commentId: String, author: String, date: Date, text: String
},{ _id : false })
const articleSchema = new mongoose.Schema({
	author: String, img: String, date: Date, text: String,
	comments: [ commentSchema ]
})

const userSchema = new mongoose.Schema({
	username: String, salt: String, hash: String, auth_fb:String
})

const profileSchema = new mongoose.Schema({
	username: String, headline: String, following: [ String ],
	email: String, zipcode: String, avatar: String, dob: Date
})




export const Article = mongoose.model('articles', articleSchema)
export const User = mongoose.model('users', userSchema)
export const Profile = mongoose.model('profiles', profileSchema)
