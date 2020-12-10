/* -------------------------------------------------------------------------- */
/*                                 DEFINITIONS                                */
/* -------------------------------------------------------------------------- */
// ANCHOR GLOBALS

enum PieceType {
    pawn,
    rook,
    knight,
    bishop,
    queen,
    king,
    empty
}


const TableDomElement = document.querySelector('table') as HTMLTableElement;

/**
 * a map to get the dom element of any corresponding chess coordinates
 */
let chessDomMap: HTMLTableDataCellElement[][];
/**
 * the Mouse position in chess coordinates (-1, -1 if out of the game board)
 */
const chessMousePos = new Vector(-1, -1);
/**
 * a set with every pressed down keys
 */
const KeysPressed = new Set<string>();


const PIECE_EMPTY: PieceType.empty = PieceType.empty;

/**
 * a map with every pieces
 */
let piecesMap: PiecesMap;

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
 * list of every "custom" (user created) arrows
 */
const customArrows: Set<Arrow> = new Set();
/**
 * selected custom arrow that will follow the cursor
 */
let selectedCustomArrow: Arrow | null = null;
/**
 * flag saying if the user is currently working with custom arrows
 */
let customArrowMode = false;
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
/**
 * every possible moves of the selected piece
 */
let acutalPossibleMoves: Move[] = [];
/**
 * list of every dom elements with the class chess_checking_move to remove it later
 */
let lastCheckingMoveDomElements: HTMLTableDataCellElement[] = [];
/**
 * keep track of if the turn is ours
 */
let clientTurn = false;
let onSendMove: (move: Move) => any = () => { };


/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */
// ANCHOR FUNCTIONS

/* --------------------------- PIECEMAP GENERATION -------------------------- */
// ANCHOR .    piecemap generation

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

/* -------------------------- DOM RELATED FUCNTIONS ------------------------- */
// ANCHOR .    dom related

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

function addEventsListenersToChessTilesDom(playingSide: 0 | 1) {
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            chessDomMap[x][y].addEventListener('mouseover', () => {
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
                    const arrowCommingfromEnemyPiece = (piecesMap[selectedPiece.y][selectedPiece.x] as NotEmptyPiece).color !== (playingSide ? "black" : "white");
                    moveArrow.style = arrowCommingfromEnemyPiece ? Arrow.DefaultSyles.disabled : clientTurn ? Arrow.DefaultSyles.wrong : Arrow.DefaultSyles.disabled;
                    for (let i of acutalPossibleMoves) {
                        if (i.performOnto.equals(chessMousePos)) {
                            moveArrow.style = arrowCommingfromEnemyPiece ? Arrow.DefaultSyles.disabled : clientTurn ? moveTypeToStyle(i.type).arrow : Arrow.DefaultSyles.disabled;
                            break;
                        }
                    }
                }
                if (selectedCustomArrow !== null) {
                    selectedCustomArrow.interpolateTo({
                        startPos: null,
                        endPos: chessMousePos.clone()
                    })
                }
            });
        }
    }
}

function fixCanvasRenderingPlayingSideDomIssue(playingSide: 0 | 1) {
    if (playingSide === 1) {
        const units = getChessToRealCoordUnits();
        ctx.translate(ctx.canvas.width + units.x, ctx.canvas.height + units.y);
        ctx.scale(-1, -1);
    }
}

function removeOldTilesCssClasses() {
    // remove css class to last hovered tile
    if (!isOutside(lastInsideMouseCoordinates)) {
        chessDomMap[lastInsideMouseCoordinates.y][lastInsideMouseCoordinates.x].classList.remove('chess_hover');
    }
    // remove css classes for last highlighted tiles
    for (let i of lastPossibleMovesDomElements) {
        i.classList.remove(moveTypeToStyle("move").css);
        i.classList.remove(moveTypeToStyle("capture").css);
    }
    lastPossibleMovesDomElements = [];

    // remove last selected tile's css class
    if (!selectedPiece.equals(new Vector(-1, -1)))
        chessDomMap[selectedPiece.y][selectedPiece.x].classList.remove("chess_selected");

    for (let i of lastCheckingMoveDomElements) {
        i.classList.remove("chess_checking_move");
    }
    lastCheckingMoveDomElements = [];
}

/* -------------------------- MOVE RELATED FUNCTION ------------------------- */
// ANCHOR .    move related

function moveTypeToStyle(moveType: MoveType) {
    switch (moveType) {
        case "move":
            return { css: "chess_possible_move", arrow: Arrow.DefaultSyles.move };
        case "capture":
            return { css: "chess_possible_capture", arrow: Arrow.DefaultSyles.capture };
    }
}

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

/* ------------------------ EVENTS RELATED FUNCTIONS ------------------------ */
// ANCHOR .    events related

function onKeyUpdate(removedKeys: Set<string>) {
    if (KeysPressed.has("KeyH")) {
        showLogs = !showLogs;
    }
    if ((removedKeys.has("ShiftLeft") || (removedKeys.has("ShiftRight")) && customArrowMode)) {
        customArrowEnd();
    }
    if (isShiftPressed() && KeysPressed.has("KeyD")) {
        customArrowEnd();
        /**
         * yes i know it looks dump clearing custom arrows then searching for them in activeArrows
         * to delete them, but, for some god damn reason there's a way (if you do it fast enough)
         * to create a custom arrow without it being added to Custom arrows, so i only can do it
         * this way.
         */
        customArrows.clear();
        Arrow.ActiveArrows.forEach(v => {
            if (v.style === Arrow.DefaultSyles.custom) {
                v.interpolateTo({
                    startPos: null,
                    endPos: v.getFinaleState().startPos
                })
                setTimeout(() => {
                    v.disable()
                }, v.transitionDuration);
            };
        })
    }
    MainLog.set("keys", Array.from(KeysPressed.keys()).toString());
}

function isShiftPressed() {
    return (KeysPressed.has("ShiftLeft") || KeysPressed.has("ShiftRight"));
}

function updateCanvasSize(playingSide: 0 | 1) {
    const tableHeight = TableDomElement.getBoundingClientRect().height;
    const tableWidth = TableDomElement.getBoundingClientRect().width;
    canvasOverlay.style.width = tableWidth + "px";
    canvasOverlay.style.height = tableHeight + "px";
    canvasOverlay.width = tableWidth;
    canvasOverlay.height = tableHeight;
    ctx.resetTransform();
    fixCanvasRenderingPlayingSideDomIssue(playingSide);
}

function customArrowStart() {
    if (isOutside(chessMousePos)) return;
    const arrow = new Arrow(chessMousePos.clone(), chessMousePos.clone(), true, Arrow.DefaultSyles.custom);
    customArrows.add(arrow);
    selectedCustomArrow = arrow;
    customArrowMode = true;
}

function customArrowEnd() {
    if (selectedCustomArrow !== null) {
        if (selectedCustomArrow.startPos.equals(selectedCustomArrow.endPos)) {
            customArrows.delete(selectedCustomArrow);
        }
        let found = false;
        customArrows.forEach(v => {
            selectedCustomArrow = <Arrow>selectedCustomArrow;
            if (selectedCustomArrow.getFinaleState().startPos.equals(v.startPos) && selectedCustomArrow.getFinaleState().endPos.equals(v.endPos) && selectedCustomArrow.uuid !== v.uuid) {
                customArrows.delete(v);
                v.disable();
                found = true;
            }
        });
        if (found) {
            customArrows.delete(selectedCustomArrow)
            selectedCustomArrow.disable()
        };
    }
    customArrowMode = false;
    selectedCustomArrow = null;
}

/* -------------------------------------------------------------------------- */
/*                               EVENT LISTENERS                              */
/* -------------------------------------------------------------------------- */
// ANCHOR EVENTS LISTENERS

function addAllEventsListeners(playingSide: 0 | 1) {

    window.addEventListener('resize', () => updateCanvasSize(playingSide));

    window.addEventListener('keydown', e => {
        if (!KeysPressed.has(e.code)) {
            KeysPressed.add(e.code);
        }
        onKeyUpdate(new Set());
    });
    window.addEventListener('keyup', e => {
        const removed = new Set<string>();
        if (KeysPressed.has(e.code)) {
            KeysPressed.delete(e.code);
            removed.add(e.code);
        }
        onKeyUpdate(removed);
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
            // if mouse was inside and the last coordinates were inside (to avoid getting negative index)
            if (!mouseWasInsideLastCall && !isOutside(lastInsideMouseCoordinates)) {
                chessDomMap[lastInsideMouseCoordinates.y][lastInsideMouseCoordinates.x].classList.remove('chess_hover');
            }
            mouseWasInsideLastCall = true;
        }
    });

    window.addEventListener('click', () => {
        const ShiftPressed = isShiftPressed();

        removeOldTilesCssClasses();

        // unselect if already selected
        selectedPiece = selectedPiece.equals(chessMousePos) ? new Vector(-1, -1) : chessMousePos.clone();

        ShiftPressed && (selectedPiece = new Vector(-1, -1));

        const selectedPieceType = !isOutside(selectedPiece) ? piecesMap[selectedPiece.y][selectedPiece.x] : PIECE_EMPTY;

        let moveClicked: Move | null = null;
        if (clientTurn && acutalPossibleMoves.length > 0 && acutalPossibleMoves.map(m => { if (m.performOnto.equals(selectedPiece)) { moveClicked = m; return true; } return false; }).reduce((o, v) => o || v)) {
            const move = moveClicked as unknown as Move;
            const movingPiece = piecesMap[move.performFrom.y][move.performFrom.x];
            if (movingPiece !== PIECE_EMPTY && movingPiece.color === (playingSide ? "black" : "white")) {
                selectedPiece = new Vector(-1, -1);
                performMove(move, piecesMap);
                updatePieceDom(piecesMap);
                acutalPossibleMoves.splice(0);
                onSendMove(move);
            }
        }

        // unselect if clicked on empty piece
        if (selectedPieceType === PIECE_EMPTY) selectedPiece = new Vector(-1, -1);

        if (!isOutside(selectedPiece) && !ShiftPressed) {
            chessDomMap[selectedPiece.y][selectedPiece.x].classList.add("chess_selected");

            // change arrow type if knight
            moveArrow.pathDirrect = (selectedPieceType as NotEmptyPiece).type !== PieceType.knight;

            // for esthetic if(used to be unselected)
            if (selectedPiece.equals(new Vector(-1, -1))) {
                moveArrow.startPos = selectedPiece.clone();
                moveArrow.endPos = chessMousePos.clone();
                moveArrow.resetInterpolation();
            } else {
                moveArrow.interpolateTo({
                    startPos: selectedPiece.clone(),
                    endPos: chessMousePos.clone()
                });
            }

            acutalPossibleMoves = getPossiblesMoves(selectedPiece, piecesMap);
            MainLog.set("moves", JSON.stringify(acutalPossibleMoves.map(v => v.type + " " + (v.checking === null ? 0 : 1))).replace(/\{\[/g, "$&\n"))

            for (let i of acutalPossibleMoves) {
                const domEl = chessDomMap[i.performOnto.y][i.performOnto.x];
                const style = moveTypeToStyle(i.type);
                domEl.classList.add(style.css);
                lastPossibleMovesDomElements.push(domEl);
                if (i.checking !== null) {
                    domEl.classList.add("chess_checking_move");
                    lastCheckingMoveDomElements.push(domEl);
                }
            }

        } else {
            moveArrow.interpolateTo({
                startPos: null,
                endPos: moveArrow.startPos
            });
            acutalPossibleMoves.splice(0);
        }

        MainLog.set("selected piece", selectedPiece.toString());
    });

    window.addEventListener("mousedown", () => {
        if (isShiftPressed()) {
            customArrowStart();
        }
    });

    window.addEventListener("mouseup", () => {
        if (customArrowMode) {
            customArrowEnd();
        }
    });

}