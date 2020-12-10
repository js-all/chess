"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const utils = __importStar(require("./utils"));
const game_1 = require("./game");
const app = express_1.default();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const { abs } = utils;
app.use('/js', express_1.default.static(abs('./app/ts')));
app.use('/css', express_1.default.static(abs('./app/css')));
app.use('/chess_icons', express_1.default.static(abs('./app/chess_icons')));
app.get('/', (req, res) => {
    res.send('heya there buddy');
});
app.get('/p/:game_code', (req, res) => {
    const code = req.params.game_code || "";
    if (utils.verrifyPageCode(code)) {
        if (!game_1.Game.List.has(code)) {
            new game_1.Game(code);
        }
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
    res.redirect(`/p/${utils.generatePageCode()}`);
});
io.of("/p").on("connection", (socket) => {
    ///@ts-expect-error
    const code = socket.handshake.headers.referer.split('/').pop();
    const game = game_1.Game.List.get(code);
    if (game === undefined) {
        console.error('attempting to connect websockets to uncreated game: ' + code);
        socket.disconnect();
        return;
    }
    game.addPlayer(socket);
});
server.listen(42069);
