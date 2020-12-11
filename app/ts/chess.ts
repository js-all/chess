import Vector from './Vector';
import { Arrow, getChessToRealCoordUnits, updateCanvasSize } from './arrows';
import { PieceType, PIECE_EMPTY } from './piece';
import { getPossiblesMoves, isOutside, performMove } from './moves'

/* -------------------------------------------------------------------------- */
/*                                 DEFINITIONS                                */
/* -------------------------------------------------------------------------- */
// ANCHOR GLOBALS


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
let onSendMoveOnCallback: (move: Move) => any = () => { };


/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */
// ANCHOR FUNCTIONS

/* --------------------------- PIECEMAP -------------------------- */
// ANCHOR .    piecemap


function setPieceMap(val: PiecesMap) {
    piecesMap = val;
}

function getPieceMap() {
    return piecesMap;
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

function setChessDomMap(val: HTMLTableDataCellElement[][]) {
    chessDomMap = val;
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
function setTurn(val: boolean) {
    clientTurn = val;
}
function onSendMove(func: (move: Move) => any) {
    onSendMoveOnCallback = func;
}

/* ------------------------ EVENTS RELATED FUNCTIONS ------------------------ */
// ANCHOR .    events related

function onKeyUpdate(removedKeys: Set<string>) {
    if (KeysPressed.has("KeyH")) {
        Arrow.showLogs = !Arrow.showLogs;
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
                onSendMoveOnCallback(move);
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

export {
    addAllEventsListeners,
    generateDom,
    updatePieceDom,
    addEventsListenersToChessTilesDom,
    updateCanvasSize,
    onSendMove,
    setTurn,
    setPieceMap,
    getPieceMap,
    setChessDomMap
}