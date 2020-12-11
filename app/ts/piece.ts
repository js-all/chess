import { ranInt } from './utils'

enum PieceType {
    pawn,
    rook,
    knight,
    bishop,
    queen,
    king,
    empty
}
const PIECE_EMPTY = PieceType.empty;

/**
 * return an piece map full of empty pieces
 */
function initEmptyPieceMap() {
    let res: Piece[][] = [];
    for (let i = 0; i < 8; i++) {
        // if you're wondering, yes the .fill(0) here is needed, its just javascrpipt being weird
        res.push(new Array(8).fill(0).map(() => PieceType.empty));
    }
    return res as PiecesMap;
}

/**
 * return a piece map with regular chess starting position
 */
function initBasicPieceMap(): PiecesMap {
    const BLACK_PAWN: Piece = { type: PieceType.pawn, color: "black" },
        BLACK_ROOK: Piece = { type: PieceType.rook, color: "black" },
        BLACK_KNIGHT: Piece = { type: PieceType.knight, color: "black" },
        BLACK_BISHOP: Piece = { type: PieceType.bishop, color: "black" },
        BLACK_QUEEN: Piece = { type: PieceType.queen, color: "black" },
        BLACK_KING: Piece = { type: PieceType.king, color: "black" },
        WHITE_PAWN: Piece = { type: PieceType.pawn, color: "white" },
        WHITE_ROOK: Piece = { type: PieceType.rook, color: "white" },
        WHITE_KNIGHT: Piece = { type: PieceType.knight, color: "white" },
        WHITE_BISHOP: Piece = { type: PieceType.bishop, color: "white" },
        WHITE_QUEEN: Piece = { type: PieceType.queen, color: "white" },
        WHITE_KING: Piece = { type: PieceType.king, color: "white" };
    return [
        [BLACK_ROOK, BLACK_KNIGHT, BLACK_BISHOP, BLACK_QUEEN, BLACK_KING, BLACK_BISHOP, BLACK_KNIGHT, BLACK_ROOK],
        [BLACK_PAWN, BLACK_PAWN, BLACK_PAWN, BLACK_PAWN, BLACK_PAWN, BLACK_PAWN, BLACK_PAWN, BLACK_PAWN,],
        [PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY,],
        [PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY,],
        [PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY,],
        [PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY, PIECE_EMPTY,],
        [WHITE_PAWN, WHITE_PAWN, WHITE_PAWN, WHITE_PAWN, WHITE_PAWN, WHITE_PAWN, WHITE_PAWN, WHITE_PAWN,],
        [WHITE_ROOK, WHITE_KNIGHT, WHITE_BISHOP, WHITE_QUEEN, WHITE_KING, WHITE_BISHOP, WHITE_KNIGHT, WHITE_ROOK]
    ];
}

/**
 * return a fully random piecemap
 */
function initRandomPieceMap() {
    const emptyMap = initEmptyPieceMap();
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            emptyMap[y][x] = ranInt(0, 1) ? PIECE_EMPTY : { color: ranInt(0, 1) ? "white" : "black", type: ranInt(0, 5) } as Piece;
        }
    }
    return emptyMap;
}

function clonePieceMap(pm: PiecesMap) {
    return pm.map(v => [...v]) as PiecesMap;
}

function clonePiece(piece: Piece): Piece {
    return piece === PIECE_EMPTY ? piece : {
        color: piece.color,
        type: piece.type
    }
}

export {
    initBasicPieceMap,
    initEmptyPieceMap,
    initRandomPieceMap,
    clonePiece,
    clonePieceMap,
    PieceType,
    PIECE_EMPTY
}