
const expect = require('chai').expect
const fetch = require('isomorphic-fetch')

const url = path => `http://localhost:3000${path}`

describe('Validate headlines functionality', () => {

	it('should give me headline of current logged in user', (done) => {
		fetch(url('/headlines'))
		.then(r => 	r.json())
		.then(body => {
			const hs = body.headlines
			expect(hs.length).to.eql(1)
			expect(hs[0]).to.have.all.keys('username', 'headline')
		})
		.then(done)
		.catch(done)
	}, 200)

	it('should give me headline of sampleUser', (done) => {
		const username = 'sampleUser'
		fetch(url(`/headlines/${username}`))
		.then(r => 	r.json())
		.then(body => {
			const hs = body.headlines
			expect(hs.length).to.eql(1)
			expect(hs[0]).to.have.all.keys('username', 'headline')
			expect(hs[0].username).to.eql(username)
		})
		.then(done)
		.catch(done)
	}, 200)


	it('should update the headline of the default user', (done) => {

		const put = (newHeadline, username) => fetch(url('/headline'), {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(newHeadline)
		})
		.then(r => r.json())
		.then(body => {
			expect(body).to.have.all.keys('username', 'headline')
			expect(body.username).to.eql(username)
			expect(body.headline).to.eql(newHeadline.headline)
			return body.headline
		})

		let myNewHeadline = 'my new headline'

		fetch(url('/headlines'))
            .then(r => 	r.json())
            .then(body => body.headlines[0].username)
            .then(username => put({headline: myNewHeadline}, username))
            .then(() => fetch(url('/headlines')))
            .then(r => 	r.json())
            .then(body => {expect(body.headlines[0]
								.headline).to.eql(myNewHeadline)})
            .then(done)
            .catch(done)
	}, 200)




})