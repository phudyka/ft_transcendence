/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.mjs                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: phudyka <phudyka@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/26 16:25:31 by phudyka           #+#    #+#             */
/*   Updated: 2024/07/26 16:25:32 by phudyka          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

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
const port = 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));
app.use(routes);

setupSockets(io);

server.listen(port, () => {
    console.log('Server listening on port ', port);
});