const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express();

app.use(express.json())

const options = {
    key: fs.readFileSync('/app/ssl_certificates/api_auth.key'),
    cert: fs.readFileSync('/app/ssl_certificates/api_auth.crt')
};

app.get('/login', (req, res) =>
    {
        res.status(200).send(
            {
                info: "api login page"
            }
        )
    });

app.get('/42login', (req, res) =>
    {
        res.status(200).send(
            {
                info: "api 42 login page"
            }
        )
    });

app.get('/register', (req, res) =>
    {
        res.status(200).send(
            {
                info: "api register page"
            }
        )
    });

https.createServer(options, app).listen(443);