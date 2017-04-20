'use strict';

////////////////////////////////
// Upload files to Cloudinary //
////////////////////////////////
var multer = require('multer');
var stream = require('stream');
var cloudinary = require('cloudinary');

if (!process.env.CLOUDINARY_URL) {
	process.exit(1);
}

var doUpload = function doUpload(publicId, req, res, next) {

	var uploadStream = cloudinary.uploader.upload_stream(function (result) {
		// capture the url and public_id and add to the request
		req.fileurl = result.url;
		req.fileid = result.public_id;
		next();
	}, { public_id: req.body[publicId] });

	// multer can save the file locally if we want
	// instead of saving locally, we keep the file in memory
	// multer provides req.file and within that is the byte buffer

	// we create a passthrough stream to pipe the buffer
	// to the uploadStream function for cloudinary.
	var s = new stream.PassThrough();
	s.end(req.file.buffer);
	s.pipe(uploadStream);
	s.on('end', uploadStream.end);
	// and the end of the buffer we tell cloudinary to end the upload.
};

// multer parses multipart form data.  Here we tell
// it to expect a single file upload named 'image'
// Read this function carefully so you understand
// what it is doing!
var uploadImage = function uploadImage(publicId) {
	return function (req, res, next) {
		return multer().single('image')(req, res, function () {
			return doUpload(publicId, req, res, next);
		});
	};
};

module.exports = uploadImage;