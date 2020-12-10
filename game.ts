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
import { Socket } from 'socket.io';
import { textChangeRangeIsUnchanged } from 'typescript';
import { generatePageCode, verrifyPageCode, initBasicPieceMap, performMove } from './utils'

class Game {
    static List: Map<string, Game> = new Map();
    static getOnGoingGamesCodes() {
        return Array.from(Game.List.keys());
    }
    gameCode: string;
    gameState: PiecesMap;
    playersSocket: [null | Socket, null | Socket] = [null, null];
    playerTurn: 0 | 1 = 0;
    constructor(gameCode?: string) {
        this.gameCode = verrifyPageCode(gameCode || "") ? gameCode as string : generatePageCode(Game.getOnGoingGamesCodes());
        this.gameState = initBasicPieceMap();
        Game.List.set(this.gameCode, this);
    }
    /**
     * add a player to the game
     * 
     * return null (if the game is already full) or the playing side of the newely added player
     * @param socket the player's socket
     */
    addPlayer(socket: Socket) {
        const addToPlayersSocket = () => {
            if(this.playersSocket[0] === null) return this.playersSocket[0] = socket;
            else if(this.playersSocket[1] === null) return this.playersSocket[1] = socket;
        };
        const getPlayersSocketLength = () => {
            return (this.playersSocket[0] === null ? 0 : 1) + (this.playersSocket[1] === null ? 0 : 1);
        };
        if (getPlayersSocketLength() >= 2) {
            socket.emit('GameFullError');
            return;
        } else {
            const player = this.playersSocket[0] === null ? 0 : 1;
            console.log(`game ${this.gameCode}: [+] ${socket.id} (${player})`);
            socket.on('disconnect', () => {
                console.log(`game ${this.gameCode}: [-] ${socket.id} (${player})`);
                this.playersSocket[player] = null;
                if(getPlayersSocketLength() < 1) {
                    this.close();
                }
            });
            socket.emit('GameState', this.gameState, {
                playingSide: player,
                playerTurn: this.playerTurn
            } as GameMetadata);
            addToPlayersSocket();
            if(player === this.playerTurn) {
                socket.emit('Turn');
            }
            socket.on('Move', (move: Move) => {
                if(this.playerTurn === player) {
                    this.playerTurn = player === 0 ? 1 : 0;
                    performMove(move, this.gameState);
                    socket.emit('GameStateUpdate', this.gameState);
                } else {
                    socket.emit('InvalidMoveError');
                    socket.emit('GameStateUpdate', this.gameState);
                }
            });
        }
    }
    close() {
        Game.List.delete(this.gameCode);
        this.playersSocket.forEach(v => v?.disconnect());
    }
}

export { Game };