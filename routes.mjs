import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get('/main.mjs', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'main.mjs'));
});

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

router.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

export default router;
