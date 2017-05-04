
const expect = require('chai').expect
const fetch = require('isomorphic-fetch')

const url = path => `http://localhost:3000${path}`


describe('Validate Article functionality', () => {


	const _fetchAndCheck = (dest, cb) =>
		fetch(url(dest))
		.then(r => 	r.json())
		.then(body => cb(body))

	const fetchAndCheck = (done, dest, cb) => {
		_fetchAndCheck(dest, cb)
		.then(done)
		.catch(done)
	}

	it('should give me more than three articles', (done) => {
		fetchAndCheck(done, '/articles', body => {
			expect(body.articles.length).to.be.at.least(3)
		})
	}, 200)

	it('should post a new article and get the article as response', (done) => {
		const newArticle = {text: 'test text'}
		const post = () => fetch(url('/article'), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(newArticle)
		})
		.then(r => r.json())
		.then(body => {
			expect(body.articles).to.have.length(1)
			const a = body.articles[0]
			expect(a).to.have.any.keys('_id', 'text')
			expect(a.text).to.eql(newArticle.text)
			return a._id
		})
		let numArticles
		//First GET and count the current number of articles, 
		//then post a new one
		//check if the number of articles increments by one
		_fetchAndCheck('/articles', body => {
			numArticles =  body.articles.length
		})
		.then(post)
		.then(() => fetchAndCheck(done, '/articles', body => {
			expect(body.articles).to.have.length(numArticles + 1)
		}))
	}, 200)

	it('should return an article with a specified id', (done) => {
		fetchAndCheck(done, '/articles', body => {
			const n = body.articles.length
			const id = body.articles[n - 1]._id
			return _fetchAndCheck(`/articles/${id}`, body => {
				expect(body.articles.length).to.eql(1)
				expect(body.articles[0]._id).to.eql(id)
			})
		})
	}, 200)


})