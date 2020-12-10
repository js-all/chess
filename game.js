"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const utils_1 = require("./utils");
class Game {
    constructor(gameCode) {
        this.playersSocket = [null, null];
        this.playerTurn = 0;
        this.gameCode = utils_1.verrifyPageCode(gameCode || "") ? gameCode : utils_1.generatePageCode(Game.getOnGoingGamesCodes());
        this.gameState = utils_1.initBasicPieceMap();
        Game.List.set(this.gameCode, this);
    }
    static getOnGoingGamesCodes() {
        return Array.from(Game.List.keys());
    }
    /**
     * add a player to the game
     *
     * return null (if the game is already full) or the playing side of the newely added player
     * @param socket the player's socket
     */
    addPlayer(socket) {
        const addToPlayersSocket = () => {
            if (this.playersSocket[0] === null)
                return this.playersSocket[0] = socket;
            else if (this.playersSocket[1] === null)
                return this.playersSocket[1] = socket;
        };
        const getPlayersSocketLength = () => {
            return (this.playersSocket[0] === null ? 0 : 1) + (this.playersSocket[1] === null ? 0 : 1);
        };
        if (getPlayersSocketLength() >= 2) {
            socket.emit('GameFullError');
            return;
        }
        else {
            const player = this.playersSocket[0] === null ? 0 : 1;
            console.log(`game ${this.gameCode}: [+] ${socket.id} (${player})`);
            socket.on('disconnect', () => {
                console.log(`game ${this.gameCode}: [-] ${socket.id} (${player})`);
                this.playersSocket[player] = null;
                if (getPlayersSocketLength() < 1) {
                    this.close();
                }
            });
            socket.emit('GameState', this.gameState, {
                playingSide: player,
                playerTurn: this.playerTurn
            });
            addToPlayersSocket();
            if (player === this.playerTurn) {
                socket.emit('Turn');
            }
            socket.on('Move', (move) => {
                if (this.playerTurn === player) {
                    this.playerTurn = player === 0 ? 1 : 0;
                    utils_1.performMove(move, this.gameState);
                    socket.emit('GameStateUpdate', this.gameState);
                }
                else {
                    socket.emit('InvalidMoveError');
                    socket.emit('GameStateUpdate', this.gameState);
                }
            });
        }
    }
    close() {
        Game.List.delete(this.gameCode);
        this.playersSocket.forEach(v => v === null || v === void 0 ? void 0 : v.disconnect());
    }
}
exports.Game = Game;
Game.List = new Map();
