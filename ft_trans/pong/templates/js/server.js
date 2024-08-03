const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 8000;

const pool = new Pool({
  user: 'fabriciopa',
  host: 'localhost',
  database: 'db',
  password: '5472',
  port: 5432,
});

app.use(express.json());

app.lisen(port , () => {
  console.log(`Server is running on port ${port}`);
});


const data = { username: 'example' , password: 'example' };

fetch('api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
  .then((response) => response.json())
  .then((data) => {
    console.log('Success:', data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
