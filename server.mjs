import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes.mjs';
import setupSockets from './sockets.mjs';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));
app.use(routes);

setupSockets(io);

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});