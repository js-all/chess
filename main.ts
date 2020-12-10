import http from 'http';
import express from 'express';
import { Server, Socket } from 'socket.io';
import * as utils from './utils';
import { Game } from './game'

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const { abs } = utils;

app.use('/js', express.static(abs('./app/ts')));
app.use('/css', express.static(abs('./app/css')));
app.use('/chess_icons', express.static(abs('./app/chess_icons')))


app.get('/', (req, res) => {
    res.send('heya there buddy');
});

app.get('/p/:game_code', (req, res) => {
    const code = req.params.game_code || "";
    if (utils.verrifyPageCode(code)) {
        if (!Game.List.has(code)) {
            new Game(code);
        }
        res.sendFile(abs('./app/index.html'));
    } else {
        res.redirect('/random');
    }

});

app.get('/p', (req, res) => {
    res.redirect('/random');
});

app.get('/random', (req, res) => {
    res.redirect(`/p/${utils.generatePageCode()}`);
});

io.of("/p").on("connection", (socket: Socket) => {
    ///@ts-expect-error
    const code: string = socket.handshake.headers.referer.split('/').pop();
    const game = Game.List.get(code);
    if (game === undefined) {
        console.error('attempting to connect websockets to uncreated game: ' + code);
        socket.disconnect();
        return;
    }
    game.addPlayer(socket);
});

server.listen(42069)
