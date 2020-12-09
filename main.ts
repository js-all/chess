import express from 'express';
import {Server, Socket} from 'socket.io';
import utils from './utils';
import path from 'path';
import http from 'http'

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const {abs} = utils;

app.use('/js', express.static(abs('./app/ts')));
app.use('/css', express.static(abs('./app/css')));
app.use('/chess_icons', express.static(abs('./app/chess_icons')))


app.get('/', (req, res) => {
    res.send('heya there buddy');
});

app.get('/p/:game_code', (req, res) => {
    const code = req.params.game_code as string;
    res.sendFile(abs('./app/index.html'));
});

app.get('/random', (req, res) => {
    res.redirect(`/p/${utils.generatePageCode()}`);
});

server.listen(42069)