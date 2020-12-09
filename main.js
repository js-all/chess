"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const utils_1 = __importDefault(require("./utils"));
const http_1 = __importDefault(require("http"));
const app = express_1.default();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const { abs } = utils_1.default;
app.use('/js', express_1.default.static(abs('./app/ts')));
app.use('/css', express_1.default.static(abs('./app/css')));
app.use('/chess_icons', express_1.default.static(abs('./app/chess_icons')));
app.get('/', (req, res) => {
    res.send('heya there buddy');
});
app.get('/p/:game_code', (req, res) => {
    const code = req.params.game_code || "";
    if (utils_1.default.verrifyPageCode(code)) {
        res.sendFile(abs('./app/index.html'));
    }
    else {
        res.redirect('/random');
    }
});
app.get('/p', (req, res) => {
    res.redirect('/random');
});
app.get('/random', (req, res) => {
    res.redirect(`/p/${utils_1.default.generatePageCode()}`);
});
io.of("/p").on("connection", (socket) => {
    ///@ts-expect-error
    const code = socket.handshake.headers.referer.split('/').pop();
    console.log(code);
});
server.listen(42069);
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
