#!/bin/bash
PORT=3000

echo "GET /"
curl -H 'Content-Type: application/json' http://localhost:${PORT}
echo ""
echo ""



echo "POST /register cl423"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/register -d "{\"username\":\"cl423\", \"email\":\"cl@rice.edu\", \"dob\": \"999988819437.9495\", \"zipcode\": \"77005\", \"password\":\"visitor\"}"
echo ""
echo ""

echo "POST /login cl423"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/login -d "{\"username\":\"cl423\", \"password\":\"visitor\"}"
echo ""
echo ""

echo "GET /articles"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/articles
echo ""
echo ""

echo "POST /article"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/article -d "{ \"text\":\"This is my new article! $(date)\" }" 
echo ""
echo ""

echo "GET /articles"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/articles 
echo ""
echo ""


echo "GET /following"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/following
echo ""
echo ""


echo "GET /following/sampleUser"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/following/sampleUser
echo ""
echo ""

echo "PUT /following/sampleUser"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/following/sampleUser -X PUT
echo ""
echo ""

echo "DELETE /following/sampleUser"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/following/sampleUser -X DELETE
echo ""
echo ""


echo "GET /email"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/email
echo ""
echo ""

echo "GET /email/sampleUser"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/email/sampleUser
echo ""
echo ""

echo "PUT /email"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/email -X PUT -d "{\"email\":\"a@gmail.com\"}"
echo ""
echo ""

echo "GET /zipcode"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/zipcode
echo ""
echo ""

echo "GET /zipcode/sampleUser"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/zipcode/sampleUser
echo ""
echo ""

echo "PUT /zipcode"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/zipcode -X PUT -d "{\"zipcode\":\"77005\"}"
echo ""
echo ""

echo "GET /dob"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/dob
echo ""
echo ""

echo "GET /avatars"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/avatars
echo ""
echo ""

echo "GET /avatars/sampleUser"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/avatars/sampleUser
echo ""
echo ""

echo "PUT /avatar"
curl -H 'Content-Type: application/json' http://localhost:${PORT}/avatar -X PUT -d "{\"xxx\":\"77005\"}"
echo ""
echo ""
