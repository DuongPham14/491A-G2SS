
const https = require('http');
const fs = require("fs");
const app = require('./app');
const port = process.env.PORT || 3000;

/*
const server = https.createServer({
    key: fs.readFileSync('./hidden/key.pem'),
    cert: fs.readFileSync('./hidden/cert.pem'),
    passphrase: 'secretPhrase'
}, app);
*/

const server = https.createServer(app);

server.listen(port, function() {
    console.log('Server started on port ' + port);
});