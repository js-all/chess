/* -------------------------------------------------------------------------- */
/*                                 DEFINITIONS                                */
/* -------------------------------------------------------------------------- */

/* ---------------------------- TYPESCRIPT TYPES ---------------------------- */
// ANCHOR TYPES

// piece map
// typescript really need a way to do that cleaner
type Tuple8<T> = [T, T, T, T, T, T, T, T];
type Tuple8x8<T> = Tuple8<Tuple8<T>>;
type PiecesMap = Tuple8x8<Piece>;

// piece
interface NotEmptyPiece {
    type: PieceType,
    color: "black" | "white"
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

type Piece = NotEmptyPiece | PieceType.empty;

// move
type MoveType = "move" | "capture" | "check";

interface Move {
    performFrom: Vector,
    performOnto: Vector,
    type: MoveType
}


/* ------------------------- CONSTANTS AND GLOBALSS ------------------------- */
// ANCHOR GLOBALS

const TableDomElement = document.querySelector('table') as HTMLTableElement;
/**
 * 0 - white
 * 
 * 1 - black
 */
const playingSide: 0 | 1 = 0;
/**
 * a map to get the dom element of any corresponding chess coordinates
 */
const chessDomMap = generateDom(playingSide);
/**
 * the Mouse position in chess coordinates (-1, -1 if out of the game board)
 */
const chessMousePos = new Vector(-1, -1);
/**
 * a set with every pressed down keys
 */
const KeysPressed = new Set<string>();

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
    WHITE_KING: Piece = { type: PieceType.king, color: "white" },
    PIECE_EMPTY: Piece = PieceType.empty;

/**
 * a map with every pieces
 */
const piecesMap: PiecesMap = initBasicPieceMap();

/**
 * a flag set to true when the mouse was inside last onMouseMove event
 */
let mouseWasInsideLastCall = false;
/**
 * the last Chess Mouse coordinates before the cursor left the board
 */
let lastInsideMouseCoordinates = new Vector(-1, -1);

/**
 * the arrow object shown when selecting pieces
 */
const moveArrow = new Arrow(new Vector(0, 0), new Vector(0, 0), true, Arrow.DefaultSyles.move);
/**
 * log object for the main script, refer to Arrow.DrawLogs's doc for more details 
 */
const MainLog = Arrow.DrawLogs.set("Main", new Map()).get("Main") as Map<string, string>;

/**
 * the selected piece's coordinates (-1, -1 if none)
 */
let selectedPiece: Vector = new Vector(-1, -1);
/**
 * a list of the dom elements with special css class (used for moves highlights) to be able to clear them without having to loop throught every single one
 */
let lastPossibleMovesDomElements: HTMLTableDataCellElement[] = [];
let acutalPossibleMoves: Move[] = [];


/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */


/* --------------------------- PIECEMAP GENERATION -------------------------- */
// ANCHOR PIECEMAP GENERATION

updatePieceDom(piecesMap);

/**
 * return an piece map full of empty pieces
 */
function initEmptyPieceMap() {
    let res: Piece[][] = [];
    for (let i = 0; i < 8; i++) {
        // if you're wondering, yes the .fill(0) here is needed, its just javascrpipt being weird
        res.push(new Array(8).fill(0).map(v => PieceType.empty));
    }
    return res as PiecesMap;
}

/**
 * return a piece map with regular chess starting position
 */
function initBasicPieceMap(): PiecesMap {
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
    const pieces = [BLACK_ROOK, BLACK_KING, BLACK_BISHOP, BLACK_KING, BLACK_QUEEN, BLACK_PAWN, WHITE_ROOK, WHITE_KNIGHT, WHITE_BISHOP, WHITE_KING, WHITE_QUEEN, WHITE_PAWN, PIECE_EMPTY, PIECE_EMPTY];
    for(let y = 0; y < 8; y++) {
        for(let x = 0; x < 8; x++) {
            emptyMap[y][x] = pieces[ranInt(0, pieces.length-1)];
        }
    }
    return emptyMap;
}

/* -------------------------- DOM RELATED FUCNTIONS ------------------------- */
// ANCHOR DOM RELATED

/**
 * poppulate the dom with all the td and tr elements to make the chess board
 */
function generateDom(playingSide: 0 | 1) {
    const lettersArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const tobdyEl = TableDomElement.firstElementChild as HTMLElement;
    const domElementsMap = new Array(8).fill(0).map(() => new Array(8));
    // -1 because we want to add another row for the letters and numbers on the left and top
    for (let y = -1; y < 8; y++) {
        const trEl = document.createElement('tr');

        if (y === -1) {
            trEl.id = "chess_letters";

            for (let i = 0; i <= 8; i++) {
                const tdEl = document.createElement('td');

                tdEl.classList.add('chess_letter');
                tdEl.classList.add('chess_key');

                if (i === 0) {
                    tdEl.classList.add('empty_chess_letter');
                    tdEl.innerHTML = " "
                } else {
                    tdEl.innerHTML = lettersArray[playingSide ? Math.abs(i - 8) : i - 1];
                }

                trEl.appendChild(tdEl);
            }
            tobdyEl.appendChild(trEl);

            continue;
        }

        trEl.classList.add('chess_row');
        // -1 for the same reason
        for (let x = -1; x < 8; x++) {
            const tdEl = document.createElement('td');

            if (x === -1) {
                tdEl.classList.add('chess_number');
                tdEl.classList.add('chess_key');
                tdEl.innerHTML = playingSide === 1 ? y + 1 + "" : Math.abs(y - 8) + "";
                trEl.appendChild(tdEl);
                continue;
            }

            tdEl.classList.add('chess_col');
            tdEl.id = `chess_cell[${x},${y}]`;
            domElementsMap[y][x] = tdEl;
            trEl.appendChild(tdEl);
        }
        tobdyEl.appendChild(trEl);
    }
    const DEM = domElementsMap as HTMLTableDataCellElement[][];
    return playingSide === 0 ? DEM : DEM.map(v => v.reverse()).reverse();
}

/**
 * update the dom to match the piece map
 * @param pm the piece map to update the dom from
 */
function updatePieceDom(pm: PiecesMap) {
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            const chessSlot = chessDomMap[x][y];
            while (chessSlot.childElementCount > 0) {
                chessSlot.removeChild(chessSlot.firstElementChild as HTMLElement);
            }
            if (pm[x][y] === PieceType.empty) continue;
            const pieceElWrapper = document.createElement('div');
            pieceElWrapper.classList.add('chess_piece_wrapper');
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('chess_piece');
            pieceElement.classList.add(`chess_piece_${PieceType[(pm[x][y] as NotEmptyPiece).type]}`);
            pieceElement.classList.add(`chess_piece_${(pm[x][y] as NotEmptyPiece).color}`)
            pieceElWrapper.appendChild(pieceElement);
            chessSlot.appendChild(pieceElWrapper);
        }
    }
}

function addEventsListenersToChessTilesDom() {
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            chessDomMap[x][y].addEventListener('mouseover', e => {
                if (!chessMousePos.equals(new Vector(-1, -1))) {
                    chessDomMap[chessMousePos.y][chessMousePos.x].classList.remove('chess_hover');
                }
                chessMousePos.set(new Vector(y, x));
                MainLog.set("mouse pos", chessMousePos.toString());
                if (!selectedPiece.equals(new Vector(-1, -1))) {
                    chessDomMap[chessMousePos.y][chessMousePos.x].classList.add('chess_hover');
                    moveArrow.interpolateTo({
                        startPos: selectedPiece.clone(),
                        endPos: chessMousePos.clone()
                    });
                    moveArrow.style = Arrow.DefaultSyles.wrong;
                    for (let i of acutalPossibleMoves) {
                        if (i.performOnto.equals(chessMousePos)) {
                            moveArrow.style = moveTypeToStyle(i.type).arrow;
                            break;
                        }
                    }
                }
            });
        }
    }
}

/* -------------------------- MOVE RELATED FUNCTION ------------------------- */
// ANCHOR MOVE RELATED

function moveTypeToStyle (moveType: MoveType) {
    switch (moveType) {
        case "move":
            return { css: "chess_possible_move", arrow: Arrow.DefaultSyles.move };
        case "capture":
            return { css: "chess_possible_capture", arrow: Arrow.DefaultSyles.capture };
        case "check":
            return { css: "chess_possible_capture", arrow: Arrow.DefaultSyles.check };
    }
}

function getPossiblesMoves(pieceCoordinates: Vector, pm: PiecesMap): Move[] {
    // no moves possible from an empty piece
    if (pm[pieceCoordinates.y][pieceCoordinates.x] === PIECE_EMPTY) return [];
    const piece = pm[pieceCoordinates.y][pieceCoordinates.x] as NotEmptyPiece;
    // of the chess board
    const isOutside = (pos: Vector) => pos.x < 0 || pos.y < 0 || pos.x > 7 || pos.y > 7;
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
    const checkLine = (from: Vector, dir: Vector, length: number, capture: "move or capture" | "only capture" | "only move" = "move or capture") => {
        const udir = dir.floor();
        const resMoves: Move[] = [];
        for (let i = 1; i <= length; i++) {
            const actualTile = from.add(udir.multiply(i));
            const move: Move = {
                performFrom: from,
                performOnto: actualTile,
                type: "move"
            }
            if ((capture === "only capture" && !isMoveOutside(move)) || (pushIfValid(resMoves, move) === "not empty" && capture === "move or capture")) {
                const actualPiece = pm[actualTile.y][actualTile.x];
                if (actualPiece === PIECE_EMPTY) break;
                const notEmptyPiece = actualPiece as NotEmptyPiece;
                const fromPiece = pm[from.y][from.x];
                if (fromPiece !== PIECE_EMPTY && notEmptyPiece.color !== (<NotEmptyPiece>fromPiece).color) {
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
    const getCross = (from: Vector, length: number = 8) => {
        return [
            ...checkLine(from, new Vector(1, 0), length),
            ...checkLine(from, new Vector(0, 1), length),
            ...checkLine(from, new Vector(-1, 0), length),
            ...checkLine(from, new Vector(0, -1), length),
        ];
    };
    const getDiagonalCross = (from: Vector, length: number = 8) => {
        return [
            ...checkLine(from, new Vector(1, 1), length),
            ...checkLine(from, new Vector(1, -1), length),
            ...checkLine(from, new Vector(-1, 1), length),
            ...checkLine(from, new Vector(-1, -1), length),
        ];
    };
    switch (piece.type) {
        case PieceType.bishop:
            return getDiagonalCross(pieceCoordinates);
        case PieceType.rook:
            return getCross(pieceCoordinates);
        case PieceType.king:
            return getCross(pieceCoordinates, 1).concat(getDiagonalCross(pieceCoordinates, 1));
        case PieceType.queen:
            return getCross(pieceCoordinates).concat(getDiagonalCross(pieceCoordinates));
        case PieceType.pawn:
            const dir = new Vector(0, 1).multiply(playingSide === 1 ? 1 : -1).multiply(piece.color === "white" ? 1 : -1);
            return [
                ...checkLine(pieceCoordinates, dir, 1, "only move"),
                ...checkLine(pieceCoordinates, dir.add(new Vector(1, 0)), 1, "only capture"),
                ...checkLine(pieceCoordinates, dir.add(new Vector(-1, 0)), 1, "only capture")
            ];
        case PieceType.knight:
            return [
                ...checkLine(pieceCoordinates, new Vector(1, 2), 1),
                ...checkLine(pieceCoordinates, new Vector(-1, 2), 1),
                ...checkLine(pieceCoordinates, new Vector(1, -2), 1),
                ...checkLine(pieceCoordinates, new Vector(-1, -2), 1),
                ...checkLine(pieceCoordinates, new Vector(2, 1), 1),
                ...checkLine(pieceCoordinates, new Vector(-2, 1), 1),
                ...checkLine(pieceCoordinates, new Vector(2, -1), 1),
                ...checkLine(pieceCoordinates, new Vector(-2, -1), 1),
            ];
        default:
            return [];
    }
}

/* ------------------------ EVENTS RELATED FUNCTIONS ------------------------ */
// ANCHOR EVENTS RELATED

function onKeyUpdate() {
    if (KeysPressed.has("h")) {
        showLogs = !showLogs;
    }
    MainLog.set("keys", Array.from(KeysPressed.keys()).toString());
}

function updateCanvasSize() {
    const tableHeight = TableDomElement.getBoundingClientRect().height;
    const tableWidth = TableDomElement.getBoundingClientRect().width;
    canvasOverlay.style.width = tableWidth + "px";
    canvasOverlay.style.height = tableHeight + "px";
    canvasOverlay.width = tableWidth;
    canvasOverlay.height = tableHeight;
}

updateCanvasSize();

/* -------------------------------------------------------------------------- */
/*                               EVENT LISTENERS                              */
/* -------------------------------------------------------------------------- */
// ANCHOR EVENTS LISTENERS

window.addEventListener('resize', updateCanvasSize);

window.addEventListener('keydown', e => {
    if (!KeysPressed.has(e.key)) {
        KeysPressed.add(e.key);
    }
    onKeyUpdate();
});
window.addEventListener('keyup', e => {
    if (KeysPressed.has(e.key)) {
        KeysPressed.delete(e.key);
    }
    onKeyUpdate();
});

window.addEventListener('mousemove', e => {
    const clientRect = TableDomElement.getBoundingClientRect();
    const tableRelativeCoord = new Vector(e.clientX, e.clientY).substract(new Vector(clientRect.left, clientRect.top));
    const units = getChessToRealCoordUnits();

    const outside = (tableRelativeCoord.x > clientRect.width || tableRelativeCoord.y > clientRect.height || tableRelativeCoord.x < units.x || tableRelativeCoord.y < units.y);

    if (outside && mouseWasInsideLastCall) {
        lastInsideMouseCoordinates = chessMousePos.clone();
        mouseWasInsideLastCall = false;
        chessMousePos.set(new Vector(-1, -1));
    } else if (!outside) {
        if (!mouseWasInsideLastCall && !lastInsideMouseCoordinates.equals(new Vector(-1, -1))) {
            chessDomMap[lastInsideMouseCoordinates.y][lastInsideMouseCoordinates.x].classList.remove('chess_hover');
        }
        mouseWasInsideLastCall = true;
    }
});

window.addEventListener('click', e => {


    if (!lastInsideMouseCoordinates.equals(new Vector(-1, -1))) {
        chessDomMap[lastInsideMouseCoordinates.y][lastInsideMouseCoordinates.x].classList.remove('chess_hover');
    }

    for (let i of lastPossibleMovesDomElements) {
        i.classList.remove(moveTypeToStyle("move").css);
        i.classList.remove(moveTypeToStyle("capture").css);
        i.classList.remove(moveTypeToStyle("check").css);
    }

    const usedUnselected = selectedPiece.equals(new Vector(-1, -1));

    // reset old selected piece
    if (!selectedPiece.equals(new Vector(-1, -1))) {
        const selx = selectedPiece.x;
        const sely = selectedPiece.y;
        chessDomMap[sely][selx].classList.remove("chess_selected");
    }

    // will be -1 -1 if click out of the chess board or if already selected
    selectedPiece = selectedPiece.equals(chessMousePos) ? new Vector(-1, -1) : chessMousePos.clone();
    const selectedPieceType =
        selectedPiece.x >= 0 &&
            selectedPiece.y >= 0 &&
            selectedPiece.y < piecesMap.length &&
            selectedPiece.x < piecesMap[selectedPiece.y].length ?
            piecesMap[selectedPiece.y][selectedPiece.x] :
            PIECE_EMPTY;
    if (selectedPieceType === PIECE_EMPTY) selectedPiece = new Vector(-1, -1);

    if (!selectedPiece.equals(new Vector(-1, -1))) {
        const selPieceType = selectedPieceType as NotEmptyPiece;
        const selx = selectedPiece.x;
        const sely = selectedPiece.y;
        chessDomMap[sely][selx].classList.add("chess_selected");

        const dirrect = selPieceType.type !== PieceType.knight;
        moveArrow.pathDirrect = dirrect;
        if (!usedUnselected) {
            moveArrow.interpolateTo({
                startPos: selectedPiece.clone(),
                endPos: chessMousePos.clone()
            })
        } else {
            moveArrow.startPos = selectedPiece.clone();
            moveArrow.endPos = chessMousePos.clone();
            moveArrow.resetInterpolation();
        }

        acutalPossibleMoves = getPossiblesMoves(selectedPiece, piecesMap);
        MainLog.set("moves", JSON.stringify(acutalPossibleMoves.map(v => v.type)).replace(/\{\[/g, "$&\n"))
        for (let i of acutalPossibleMoves) {
            const domEl = chessDomMap[i.performOnto.y][i.performOnto.x];
            const style = moveTypeToStyle(i.type);
            domEl.classList.add(style.css);
            lastPossibleMovesDomElements.push(domEl);
        }

    } else {
        moveArrow.interpolateTo({
            startPos: moveArrow.startPos,
            endPos: moveArrow.startPos
        })
    }

    MainLog.set("selected piece", selectedPiece.toString());
});

addEventsListenersToChessTilesDom();