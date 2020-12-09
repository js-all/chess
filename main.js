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
    const code = req.params.game_code;
    res.sendFile(abs('./app/index.html'));
});
app.get('/random', (req, res) => {
    res.redirect(`/p/${utils_1.default.generatePageCode()}`);
});
server.listen(42069);
