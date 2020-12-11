import { clonePiece, clonePieceMap, PieceType, PIECE_EMPTY } from './piece'
import Vector from './Vector';

function isOutside(pos: Vector) {
    return pos.x < 0 || pos.y < 0 || pos.x > 7 || pos.y > 7
};

function performMove(move: Move, pm: PiecesMap) {
    pm[move.performOnto.y][move.performOnto.x] = clonePiece(pm[move.performFrom.y][move.performFrom.x]);
    pm[move.performFrom.y][move.performFrom.x] = PIECE_EMPTY;
    return pm;
}

function getPossiblesMoves(pieceCoordinates: Vector, pm: PiecesMap, onlyCapture = false): Move[] {
    // no moves possible from an empty piece
    if (pm[pieceCoordinates.y][pieceCoordinates.x] === PIECE_EMPTY) return [];
    const piece = pm[pieceCoordinates.y][pieceCoordinates.x] as NotEmptyPiece;
    // of the chess board
    const isMoveOutside = (move: Move) => isOutside(move.performOnto);
    const pushIfValid = (arr: Move[], move: Move): "valid" | "not empty" | "outside" => {
        if (!isMoveOutside(move)) {
            if (pm[move.performOnto.y][move.performOnto.x] === PIECE_EMPTY) {
                arr.push(move);
                return "valid";
            } else {
                return "not empty";
            }
        } else {
            return "outside";
        }
    };
    const checkLine = (from: Vector, piece: Piece, dir: Vector, length: number, capture: "move or capture" | "only capture" | "only move" = "move or capture") => {
        const udir = dir.floor();
        const resMoves: Move[] = [];
        for (let i = 1; i <= length; i++) {
            const actualTile = from.add(udir.multiply(i));
            const move: Move = {
                performFrom: from,
                performOnto: actualTile,
                type: "move",
                checking: null
            }
            if ((capture === "only capture" && !isMoveOutside(move)) || (pushIfValid(resMoves, move) === "not empty" && capture === "move or capture")) {
                const actualPiece = pm[actualTile.y][actualTile.x];
                if (actualPiece === PIECE_EMPTY) break;
                const notEmptyPiece = actualPiece as NotEmptyPiece;
                if (piece !== PIECE_EMPTY && notEmptyPiece.color !== (<NotEmptyPiece>piece).color) {
                    move.type = "capture";
                    resMoves.push(move);
                }
                break;
            }
        }
        return resMoves;
    }
    // don't return anything if piece doesn't exist
    if (isOutside(pieceCoordinates)) return [];
    const getCross = (from: Vector, piece: Piece, length: number = 8) => {
        return [
            ...checkLine(from, piece, new Vector(1, 0), length),
            ...checkLine(from, piece, new Vector(0, 1), length),
            ...checkLine(from, piece, new Vector(-1, 0), length),
            ...checkLine(from, piece, new Vector(0, -1), length),
        ];
    };
    const getDiagonalCross = (from: Vector, piece: Piece, length: number = 8) => {
        return [
            ...checkLine(from, piece, new Vector(1, 1), length),
            ...checkLine(from, piece, new Vector(1, -1), length),
            ...checkLine(from, piece, new Vector(-1, 1), length),
            ...checkLine(from, piece, new Vector(-1, -1), length),
        ];
    };
    const getMoves = (piece: NotEmptyPiece, pieceCoordinates: Vector) => {
        switch (piece.type) {
            case PieceType.bishop:
                return getDiagonalCross(pieceCoordinates, piece);
            case PieceType.rook:
                return getCross(pieceCoordinates, piece);
            case PieceType.king:
                // technically a one liner
                // return a list of legal king moves
                return getCross(pieceCoordinates, piece, 1)
                    .concat(getDiagonalCross(pieceCoordinates, piece, 1))
                    // return a the list of possible moves for the king, without the ones that would make an enemy piece able to capture him
                    .filter(move =>
                        // return a cloned piece map of the game if the king did the move
                        (performMove(move, clonePieceMap(pm)) as PiecesMap)
                            // return an Array of rows stripped out of the piece that cannot capture the king if the move was performed
                            .map((row, y, pieceMap) =>
                                // return a row stripped of any piece that cannot capture the king if the move was performed
                                row.filter((IKMPMPiece, x) =>
                                    // return true if: the piece is not empty, the piece is an ennemy
                                    IKMPMPiece !== PIECE_EMPTY && IKMPMPiece.color !== piece.color &&
                                    // if the piece is a king (special case to avoid the king infinitely calling getPossibleMoves on each others)
                                    (IKMPMPiece.type === PieceType.king ?
                                        // make sure than the distance between both kings does not exceed 1 (in both y and x)
                                        Math.abs(x - move.performOnto.x) <= 1 && Math.abs(y - move.performOnto.y) <= 1 :
                                        // and the piece can eat the king
                                        getPossiblesMoves(new Vector(x, y), pieceMap as PiecesMap)
                                            //remove any moves that does not capture THE king
                                            .filter(m => m.type === "capture" && move.performOnto.equals(m.performOnto))
                                            // return true if a at leat a move can capture the king
                                            .length > 0)
                                ))
                            // return an array of pieces that can capture the king if the move was performed
                            .reduce((accumulator, currentValue) => accumulator.concat(...currentValue))
                            // returns false if there's at least a piece that can capture the king if the move was performed
                            .length < 1

                    );
            case PieceType.queen:
                return getCross(pieceCoordinates, piece).concat(getDiagonalCross(pieceCoordinates, piece));
            case PieceType.pawn:
                const dir = new Vector(0, 1).multiply(piece.color === "white" ? -1 : 1);
                const hasntMoved = piece.color === "black" ? pieceCoordinates.y === 1 : pieceCoordinates.y === 6;
                const straightMove: Move[] = onlyCapture ? [] : checkLine(pieceCoordinates, piece, dir, hasntMoved ? 2 : 1, "only move");
                return [
                    ...straightMove,
                    ...checkLine(pieceCoordinates, piece, dir.add(new Vector(1, 0)), 1, "only capture"),
                    ...checkLine(pieceCoordinates, piece, dir.add(new Vector(-1, 0)), 1, "only capture")
                ];
            case PieceType.knight:
                return [
                    ...checkLine(pieceCoordinates, piece, new Vector(1, 2), 1),
                    ...checkLine(pieceCoordinates, piece, new Vector(-1, 2), 1),
                    ...checkLine(pieceCoordinates, piece, new Vector(1, -2), 1),
                    ...checkLine(pieceCoordinates, piece, new Vector(-1, -2), 1),
                    ...checkLine(pieceCoordinates, piece, new Vector(2, 1), 1),
                    ...checkLine(pieceCoordinates, piece, new Vector(-2, 1), 1),
                    ...checkLine(pieceCoordinates, piece, new Vector(2, -1), 1),
                    ...checkLine(pieceCoordinates, piece, new Vector(-2, -1), 1),
                ];
            default:
                return [];
        }
    }
    const possibleMoves = getMoves(piece, pieceCoordinates);
    for (let m of possibleMoves) {
        const checkingMoves = getMoves(piece, m.performOnto).filter(v => {
            const performOntoPiece = pm[v.performOnto.y][v.performOnto.x];
            return (performOntoPiece !== PIECE_EMPTY && performOntoPiece.color !== piece.color && performOntoPiece.type === PieceType.king && v.type === "capture");
        });
        m.checking = checkingMoves.length > 0 ? checkingMoves[0].performOnto : null;
    }
    return possibleMoves;
}

/**
 * check if a move is valid
 * @param move the move to check
 * @param pm the piece map on which the move will be check
 */
function verrifyMove(move: Move, pm: PiecesMap) {
    const pieceCoordinates = move.performFrom;
    const possibleMoves = getPossiblesMoves(pieceCoordinates, pm);
    return possibleMoves.map(v => v.checking === move.checking && v.type === move.type && v.performFrom.equals(move.performFrom) && v.performOnto.equals(move.performOnto)).reduce((o, v) => o || v);
}

export {
    getPossiblesMoves,
    isOutside,
    performMove,
    verrifyMove
}