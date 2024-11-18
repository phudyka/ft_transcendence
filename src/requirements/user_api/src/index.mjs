import express from 'express';
import https from 'https';
import cors from 'cors';
import fs from 'fs';
import pgql from './postgres.mjs';

const options = {
    key: fs.readFileSync('/app/ssl_certificates/user_api.key'),
    cert: fs.readFileSync('/app/ssl_certificates/user_api.crt')
};
const app = express();
const server = https.createServer(options, app);

app.use(cors({
    origin: ["*"],
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(express.json());

async function getUsers() {
    const users = await pgql`
      select * from user limit 10
    `
    // users = Result [{ name: "Walter", age: 80 }, { name: 'Murray', age: 68 }, ...]
    console.log(users); 
    return users
  };

app.get('/', function (req, res) {
    const users = getUsers();
    res.send(JSON.stringify(users).length());
});

server.listen(443);