const express = require('express');
const passport = require('passport');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const app = express();

const {format} = require('util');
const Multer = require('multer');
const bodyParser = require('body-parser');
const {Storage} = require('@google-cloud/storage');


// Instantiates a client. If you don't specify credentials when constructing
// the client, the client library will look for credentials in the
// environment.
const storage = new Storage();


app.use(bodyParser.json());

// Multer is required to process file uploads and make them available via
// req.files.
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

const bucket = storage.bucket("pmock");

// Makes an authenticated API request.

app.get('/', (req, res) => {

	  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
  res.write('<input type="file" name="file"><br>');
  res.write('<input type="submit">');
  res.write('</form>');

  storage
  .getBuckets()
  .then((results) => {
    const buckets = results[0];

    console.log('Buckets:');
    buckets.forEach((bucket) => {
      console.log(bucket.name);
    });
  })
  .catch((err) => {
    console.error('ERROR:', err);
  });
  return res.end();
});

app.post('/fileupload',multer.single('file'), (req, res) => {
if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  // Create a new blob in the bucket and upload the file data.
  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', err => {
    next(err);
  });

  blobStream.on('finish', () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    );
	  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('<video controls="controls">');
  res.write('<source src="' + publicUrl + '" type="video/mp4"/>');
  res.write('</video>');
  res.send();
  });

  blobStream.end(req.file.buffer);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT);