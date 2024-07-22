import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.use(express.static(path.join(__dirname, 'public')));

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

router.get('/main.mjs', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'main.mjs'));
});

router.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

//renvoie des erreurs 404, a surveiller
router.use((req, res) => {
    res.status(404).send('404 Not Found');
});

export default router;
