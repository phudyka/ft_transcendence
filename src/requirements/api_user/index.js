const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express();

app.use(express.json())

const options = {
    key: fs.readFileSync('/app/ssl_certificates/api_user.key'),
    cert: fs.readFileSync('/app/ssl_certificates/api_user.crt')
};

app.get('/test', (req, res) =>
{
    res.status(200).send(
        {
            status: "ok"
        }
    )
});

app.get('/user/:id', (req, res) =>
    {
        const { id } = req.params;
        res.status(200).send(
            {
                id: `requesting data for user : ${id}`
            }
        )
    });

https.createServer(options, app).listen(443);