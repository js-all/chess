/**
 * implement timeout (lastModification > timeout (~1h))
 * TODO forfeit ui on frontend, when right cliking on king
 *
 * TODO implement main page, and game creation page as well as timer ui, AI and gameStats (who's winning).
 * 
 * TODO imlplement checking,
 * on GameStateUpdate, send the move in metadata and store a checkied flag on the server side for the players to know if they are doing a valid move
 * the client will receive a move with the checked attribute, it will then show an arrow pointing from the checking piece to the king (multiples ones if needed)
 * then block any move that doesn't uncheck the king (gonna need a isChecked function to know if the kings is still checked). for now if check mate, just don't do anything
 * it will result in an ethernal turn for the loosing player (no way of moving)
 */
import { Socket } from 'socket.io';
import { initBasicPieceMap, PieceType } from './app/ts/piece';
import { verrifyMove, performMove } from './app/ts/moves';
import Vector from './app/ts/Vector';
import { generatePageCode, verrifyPageCode } from './utils';

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
            if (this.playersSocket[0] === null) return this.playersSocket[0] = socket;
            else if (this.playersSocket[1] === null) return this.playersSocket[1] = socket;
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
                if (getPlayersSocketLength() < 1) {
                    this.close();
                }
            });
            socket.emit('GameState', this.gameState, {
                playingSide: player,
                playerTurn: this.playerTurn
            } as GameMetadata);
            addToPlayersSocket();
            if (player === this.playerTurn) {
                socket.emit('Turn');
            }
            socket.on('Move', (move: Move) => {
                const movingPiece = this.gameState[move.performFrom.y][move.performFrom.x];
                move.checking = move.checking !== null ? Vector.fromObject(move.checking as any) : null;
                move.performFrom = Vector.fromObject(move.performFrom as any);
                move.performOnto = Vector.fromObject(move.performOnto as any);
                if (this.playerTurn === player && movingPiece !== PieceType.empty && movingPiece.color === (player ? "black" : "white") && verrifyMove(move, this.gameState)) {
                    this.playerTurn = player === 0 ? 1 : 0;
                    performMove(move, this.gameState);
                    this.broadcastToPlayers("GameStateUpdate", this.gameState, {
                        playerTurn: this.playerTurn,
                        lastMove: move
                    } as GameMetadata);
                    this.playersSocket[this.playerTurn]?.emit('Turn');
                } else {
                    socket.emit('InvalidMoveError');
                    socket.emit('GameStateUpdate', this.gameState, {});
                }
            });
        }
    }
    broadcastToPlayers(ev: string, ...args: any[]) {
        if (this.playersSocket[0] !== null) this.playersSocket[0].emit(ev, ...args);
        if (this.playersSocket[1] !== null) this.playersSocket[1].emit(ev, ...args);
    }
    close() {
        Game.List.delete(this.gameCode);
        this.playersSocket.forEach(v => v?.disconnect());
    }
}

export { Game };