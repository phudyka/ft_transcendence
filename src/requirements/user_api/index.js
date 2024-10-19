const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express();

const options = {
    key: fs.readFileSync('/app/ssl_certificates/user_api.key'),
    cert: fs.readFileSync('/app/ssl_certificates/user_api.crt')
};

app.use(express.json())


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