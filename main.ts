import express from 'express';
import { Server, Socket } from 'socket.io';
import utils from './utils';
import path from 'path';
import http from 'http'

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
    console.log(code);
});

server.listen(42069)
/**
 * TODO: ADD GAMES,
 * for now just a function that create a new game, is stored in some kind of list with every games' data:
 * Map<string>: {
 *      "GameCode": {
 *          gameCode: string,
 *          gameState: piecesMap,
 *          playersSocketID (?), (to know if the game is full)
 *          creationDate: Date,
 *          lastModification: Date
 *          playerTurn,
 *      }
 * }
 * then add backend for gameStateReq (sends back the gameState of the ongoing game), OpponentMove, PlayerMove,
 * implement timeout (lastModification > timeout (~1h))
 * TODO forfeit ui on frontend, when right cliking on king
 *
 * TODO implement main page, and game creation page as well as timer ui, AI and gameStats (who's winning).
 */