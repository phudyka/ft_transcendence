const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 8000;

const pool = new Pool({
  user: 'fab',
  host: 'db',
  database: 'ft_transcendence',
  password: 'pass',
  port: 5432,
});

app.use(express.json());