const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');

const app = express();

const server = https.createServer({
    cert: fs.readFileSync('/app/ssl_certificates/user_api.crt'),
    key: fs.readFileSync('/app/ssl_certificates/user_api.key')}, 
    app);


app.get('/', function(req,res) {
    res.send('hello');
    });


server.listen(443);