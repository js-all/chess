"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPossiblesMoves = exports.performMove = exports.clonePieceMap = exports.clonePiece = exports.initRandomPieceMap = exports.initEmptyPieceMap = exports.initBasicPieceMap = exports.PieceType = exports.verrifyPageCode = exports.abs = exports.generatePageCode = exports.convertBase = void 0;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const PageCodeAllowedCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split('');
const PageCodeLength = 5;
/**
 * generate random page code
 * @param exclude code to exclude, will regenerate if it gets it (to avoid collision)
 */
function generatePageCode(exclude = []) {
    let res = "";
    for (let i = 0; i < PageCodeLength; i++) {
        const chr = Math.floor(crypto_1.default.randomBytes(1)[0] / 256 * (PageCodeAllowedCharacters.length));
        res += PageCodeAllowedCharacters[chr];
    }
    const colliding = exclude.length > 0 ? exclude.map(col => col === res).reduce((o, v) => o || v) : false;
    return colliding ? generatePageCode(exclude) : res;
}
exports.generatePageCode = generatePageCode;
function verrifyPageCode(code, include = []) {
    return code.match(/^[0-9A-Za-z]*$/g) && code.length === PageCodeLength && (include.length > 0 ? include.map(v => v === code).reduce((o, v) => o || v) : true);
}
exports.verrifyPageCode = verrifyPageCode;
/**
 * convert a number from any base to any other base
 * @param numIn the number that will be converted (an array of number, each number is a digit, 26(B10) = [2, 6]; 101(B2) = [1, 0 ,1]; FA(B16) = [16, 11])
 * @param baseFrom the base the in number is in
 * @param baseOut the base to convert numIn to
 */
function convertBase(numIn, baseFrom, baseOut) {
    return toDigits(fromDigits(numIn, baseFrom), baseOut);
}
exports.convertBase = convertBase;
function abs(absPath) {
    return path_1.default.join(__dirname, absPath);
}
exports.abs = abs;
function toDigits(n, b) {
    const digits = [];
    while (n > 0) {
        digits.push(0, n % b);
        n = Math.floor(n / b);
    }
    return digits;
}
function fromDigits(digits, b) {
    let n = 0;
    for (let d of digits) {
        n = b * n + d;
    }
    return n;
}
var PieceType;
(function (PieceType) {
    PieceType[PieceType["pawn"] = 0] = "pawn";
    PieceType[PieceType["rook"] = 1] = "rook";
    PieceType[PieceType["knight"] = 2] = "knight";
    PieceType[PieceType["bishop"] = 3] = "bishop";
    PieceType[PieceType["queen"] = 4] = "queen";
    PieceType[PieceType["king"] = 5] = "king";
    PieceType[PieceType["empty"] = 6] = "empty";
})(PieceType || (PieceType = {}));
exports.PieceType = PieceType;
const PIECE_EMPTY = PieceType.empty;
/**
 * return an piece map full of empty pieces
 */
function initEmptyPieceMap() {
    let res = [];
    for (let i = 0; i < 8; i++) {
        // if you're wondering, yes the .fill(0) here is needed, its just javascrpipt being weird
        res.push(new Array(8).fill(0).map(() => PieceType.empty));
    }
    return res;
}
exports.initEmptyPieceMap = initEmptyPieceMap;
/**
 * return a piece map with regular chess starting position
 */
function initBasicPieceMap() {
    const BLACK_PAWN = { type: PieceType.pawn, color: "black" }, BLACK_ROOK = { type: PieceType.rook, color: "black" }, BLACK_KNIGHT = { type: PieceType.knight, color: "black" }, BLACK_BISHOP = { type: PieceType.bishop, color: "black" }, BLACK_QUEEN = { type: PieceType.queen, color: "black" }, BLACK_KING = { type: PieceType.king, color: "black" }, WHITE_PAWN = { type: PieceType.pawn, color: "white" }, WHITE_ROOK = { type: PieceType.rook, color: "white" }, WHITE_KNIGHT = { type: PieceType.knight, color: "white" }, WHITE_BISHOP = { type: PieceType.bishop, color: "white" }, WHITE_QUEEN = { type: PieceType.queen, color: "white" }, WHITE_KING = { type: PieceType.king, color: "white" };
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
exports.initBasicPieceMap = initBasicPieceMap;
/**
 * return a fully random piecemap
 */
function initRandomPieceMap() {
    const emptyMap = initEmptyPieceMap();
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            emptyMap[y][x] = ranInt(0, 1) ? PIECE_EMPTY : { color: ranInt(0, 1) ? "white" : "black", type: ranInt(0, 5) };
        }
    }
    return emptyMap;
}
exports.initRandomPieceMap = initRandomPieceMap;
function clonePieceMap(pm) {
    return pm.map(v => [...v]);
}
exports.clonePieceMap = clonePieceMap;
function clonePiece(piece) {
    return piece === PIECE_EMPTY ? piece : {
        color: piece.color,
        type: piece.type
    };
}
exports.clonePiece = clonePiece;
function performMove(move, pm) {
    pm[move.performOnto.y][move.performOnto.x] = clonePiece(pm[move.performFrom.y][move.performFrom.x]);
    pm[move.performFrom.y][move.performFrom.x] = PIECE_EMPTY;
    return pm;
}
exports.performMove = performMove;
function getPossiblesMoves(pieceCoordinates, pm, onlyCapture = false) {
    // no moves possible from an empty piece
    if (pm[pieceCoordinates.y][pieceCoordinates.x] === PIECE_EMPTY)
        return [];
    const piece = pm[pieceCoordinates.y][pieceCoordinates.x];
    // of the chess board
    const isMoveOutside = (move) => isOutside(move.performOnto);
    const pushIfValid = (arr, move) => {
        if (!isMoveOutside(move)) {
            if (pm[move.performOnto.y][move.performOnto.x] === PIECE_EMPTY) {
                arr.push(move);
                return "valid";
            }
            else {
                return "not empty";
            }
        }
        else {
            return "outside";
        }
    };
    const checkLine = (from, piece, dir, length, capture = "move or capture") => {
        const udir = dir.floor();
        const resMoves = [];
        for (let i = 1; i <= length; i++) {
            const actualTile = from.add(udir.multiply(i));
            const move = {
                performFrom: from,
                performOnto: actualTile,
                type: "move",
                checking: null
            };
            if ((capture === "only capture" && !isMoveOutside(move)) || (pushIfValid(resMoves, move) === "not empty" && capture === "move or capture")) {
                const actualPiece = pm[actualTile.y][actualTile.x];
                if (actualPiece === PIECE_EMPTY)
                    break;
                const notEmptyPiece = actualPiece;
                if (piece !== PIECE_EMPTY && notEmptyPiece.color !== piece.color) {
                    move.type = "capture";
                    resMoves.push(move);
                }
                break;
            }
        }
        return resMoves;
    };
    // don't return anything if piece doesn't exist
    if (isOutside(pieceCoordinates))
        return [];
    const getCross = (from, piece, length = 8) => {
        return [
            ...checkLine(from, piece, new Vector(1, 0), length),
            ...checkLine(from, piece, new Vector(0, 1), length),
            ...checkLine(from, piece, new Vector(-1, 0), length),
            ...checkLine(from, piece, new Vector(0, -1), length),
        ];
    };
    const getDiagonalCross = (from, piece, length = 8) => {
        return [
            ...checkLine(from, piece, new Vector(1, 1), length),
            ...checkLine(from, piece, new Vector(1, -1), length),
            ...checkLine(from, piece, new Vector(-1, 1), length),
            ...checkLine(from, piece, new Vector(-1, -1), length),
        ];
    };
    const getMoves = (piece, pieceCoordinates) => {
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
                performMove(move, clonePieceMap(pm))
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
                        getPossiblesMoves(new Vector(x, y), pieceMap)
                            //remove any moves that does not capture THE king
                            .filter(m => m.type === "capture" && move.performOnto.equals(m.performOnto))
                            // return true if a at leat a move can capture the king
                            .length > 0)))
                    // return an array of pieces that can capture the king if the move was performed
                    .reduce((accumulator, currentValue) => accumulator.concat(...currentValue))
                    // returns false if there's at least a piece that can capture the king if the move was performed
                    .length < 1);
            case PieceType.queen:
                return getCross(pieceCoordinates, piece).concat(getDiagonalCross(pieceCoordinates, piece));
            case PieceType.pawn:
                const dir = new Vector(0, 1).multiply(piece.color === "white" ? -1 : 1);
                const hasntMoved = piece.color === "black" ? pieceCoordinates.y === 1 : pieceCoordinates.y === 6;
                const straightMove = onlyCapture ? [] : checkLine(pieceCoordinates, piece, dir, hasntMoved ? 2 : 1, "only move");
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
    };
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
exports.getPossiblesMoves = getPossiblesMoves;
