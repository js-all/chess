import crypto from 'crypto';
import path from 'path';


interface castInterface {
    distance: number | null,
    hit: boolean,
    position: Vector | null
}

class Vector {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    static get null() {
        return new Vector(0, 0)
    }
    negative() {
        return new Vector(-this.x, -this.y);
    }
    add(v: Vector | number) {
        if (v instanceof Vector) return new Vector(this.x + v.x, this.y + v.y);
        return new Vector(this.x + v, this.y + v);
    }
    substract(v: Vector | number) {
        if (v instanceof Vector) return new Vector(this.x - v.x, this.y - v.y);
        return new Vector(this.x - v, this.y - v);
    }
    multiply(v: Vector | number) {
        if (v instanceof Vector) return new Vector(this.x * v.x, this.y * v.y);
        return new Vector(this.x * v, this.y * v);
    }
    divide(v: Vector | number) {
        if (v instanceof Vector) return new Vector(this.x / v.x, this.y / v.y);
        return new Vector(this.x / v, this.y / v);
    }
    equals(v: Vector) {
        return this.x == v.x && this.y === v.y;
    }
    dot(v: Vector) {
        return this.x * v.x + this.y * v.y;
    }
    clamp(n: number = 4) {
        const f = (nu: number) => parseFloat(nu.toFixed(n))
        return new Vector(
            f(this.x),
            f(this.y)
        )
    }
    setLength(length: number) {
        if (this.equals(new Vector(0, 0))) return Vector.fromAngle(0, length);
        return Vector.fromAngle(this.toAngle(), length);
    }
    length() {
        return Math.sqrt(this.dot(this));
    }
    unit() {
        return this.divide(this.length());
    }
    min() {
        return Math.min(this.x, this.y);
    }
    max() {
        return Math.max(this.x, this.y);
    }
    toAngle() {
        if (this.x === 0 && this.y === 0) return 0;
        return Math.atan2(this.unit().y, this.unit().x);
    }
    angleTo(a: Vector) {
        return Math.acos(this.dot(a) / (this.length() * a.length()));
    }
    toArray(): [number, number] {
        return [this.x, this.y];
    }
    toString() {
        return `[${this.x}, ${this.y}]`;
    }
    clone() {
        return new Vector(this.x, this.y);
    }
    set(v: Vector): Vector {
        this.x = v.x;
        this.y = v.y;
        return this;
    }
    static lerp(v1: Vector, v2: Vector, factor: number): Vector {
        return v1.add(v2.substract(v1).multiply(factor));
    }
    static isVector(vec: Object) {
        return vec instanceof Vector;
    }
    init(x: number, y: number): Vector {
        this.x = x;
        this.y = y;
        return this;
    }
    perpendicular(CCW: boolean = false) {
        return CCW ? new Vector(-this.y, this.x) : new Vector(this.y, -this.x);
    }
    normal() {
        return new Vector(this.y, -this.x);
    }
    floor() {
        return new Vector(Math.floor(this.x), Math.floor(this.y));
    }
    reverse() {
        return new Vector(this.y, this.x);
    }

    map(func: (param: number, vector: Vector) => number) {
        return new Vector(func(this.x, this), func(this.y, this))
    }
    static fromAngle(angle: number = 0, length: number = 1) {
        return new Vector(Math.cos(angle) * length, Math.sin(angle) * length);
    }
    static randomDirrection(length: number | null) {
        const l = length === null ? Math.random() * Number.MAX_VALUE / 100000 : length;
        if (length === null) return Vector.fromAngle(Math.random() * (Math.PI * 2), l);
    }
    static fromObject(obj: { x: number, y: number }) {
        return new Vector(obj.x, obj.y);
    }
    static cross(a: number, b: Vector): Vector;
    static cross(a: Vector, b: Vector): number;
    static cross(a: Vector, b: number): number;
    static cross(a: Vector | number, b: Vector | number): Vector | number {
        if (typeof a === "number" && b instanceof Vector) {
            return new Vector(-a * b.y, a * b.x);
        } else if (a instanceof Vector && typeof b === "number") {
            return new Vector(b * a.y, b * a.x);
        } else if (a instanceof Vector && b instanceof Vector) {
            return a.x * b.y - a.y * b.x;
        } else {
            throw new TypeError('you can\'t use 2 numbers in this method');
        }
    }

    static fromArray(array: [number, number]): Vector {
        return new Vector(...array);
    }
}

const PageCodeAllowedCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split('');
const PageCodeLength = 5;
/**
 * generate random page code
 * @param exclude code to exclude, will regenerate if it gets it (to avoid collision)
 */
function generatePageCode(exclude: string[] = []): string {
    let res = "";
    for (let i = 0; i < PageCodeLength; i++) {
        const chr = Math.floor(crypto.randomBytes(1)[0] / 256 * (PageCodeAllowedCharacters.length));
        res += PageCodeAllowedCharacters[chr];
    }
    const colliding = exclude.length > 0 ? exclude.map(col => col === res).reduce((o, v) => o || v) : false;
    return colliding ? generatePageCode(exclude) : res;
}

function verrifyPageCode(code: string, include: string[] = []) {
    return code.match(/^[0-9A-Za-z]*$/g) && code.length === PageCodeLength && (include.length > 0 ? include.map(v => v === code).reduce((o, v) => o || v) : true);
}

/**
 * convert a number from any base to any other base
 * @param numIn the number that will be converted (an array of number, each number is a digit, 26(B10) = [2, 6]; 101(B2) = [1, 0 ,1]; FA(B16) = [16, 11])
 * @param baseFrom the base the in number is in
 * @param baseOut the base to convert numIn to
 */
function convertBase(numIn: number[], baseFrom: number, baseOut: number) {
    return toDigits(fromDigits(numIn, baseFrom), baseOut);
}

function abs(absPath: string) {
    return path.join(__dirname, absPath);
}


function toDigits(n: number, b: number) {
    const digits: number[] = [];
    while (n > 0) {
        digits.push(0, n % b);
        n = Math.floor(n / b);
    }
    return digits;
}
function fromDigits(digits: number[], b: number) {
    let n = 0;
    for (let d of digits) {
        n = b * n + d;
    }
    return n;
}

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

function isOutside(pos: Vector) {
    return pos.x < 0 || pos.y < 0 || pos.x > 7 || pos.y > 7
};

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
    convertBase,
    generatePageCode,
    abs,
    verrifyPageCode,
    PieceType,
    initBasicPieceMap,
    initEmptyPieceMap,
    initRandomPieceMap,
    clonePiece,
    clonePieceMap,
    performMove,
    getPossiblesMoves,
    verrifyMove,
    isOutside,
    Vector
}