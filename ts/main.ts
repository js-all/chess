const TableDomEl = document.querySelector('table') as HTMLTableElement;
const size = 8;
/**
 * 0 - white
 * 1 - black
 */
const playingSide: 0 | 1 = 1;
const chessDomMap = generateDom();

// typescript really need a way to do that cleaner
type Tuple8<T> = [T, T, T, T, T, T, T, T];
type Tuple8x8<T> = Tuple8<Tuple8<T>>;
type PiecesMap = Tuple8x8<Piece>;

interface NotEmptyPiece {
    type: PieceType,
    color: "black" | "white"
}


type Piece = NotEmptyPiece | PieceType.empty;
enum PieceType {
    pawn,
    rook,
    knight,
    bishop,
    queen,
    king,
    empty
}

const BPAWN: Piece = { type: PieceType.pawn, color: "black" },
    BROOK: Piece = { type: PieceType.rook, color: "black" },
    BKNIGHT: Piece = { type: PieceType.knight, color: "black" },
    BBISHOP: Piece = { type: PieceType.bishop, color: "black" },
    BQUEEN: Piece = { type: PieceType.queen, color: "black" },
    BKING: Piece = { type: PieceType.king, color: "black" },
    WPAWN: Piece = { type: PieceType.pawn, color: "white" },
    WROOK: Piece = { type: PieceType.rook, color: "white" },
    WKNIGHT: Piece = { type: PieceType.knight, color: "white" },
    WBISHOP: Piece = { type: PieceType.bishop, color: "white" },
    WQUEEN: Piece = { type: PieceType.queen, color: "white" },
    WKING: Piece = { type: PieceType.king, color: "white" },
    PEMPTY: Piece = PieceType.empty;

const piecesMap: PiecesMap = initBasicPieces(playingSide);

updatePieceDom(piecesMap);


function initEmptyPieceMap() {
    let res: Piece[][] = [];
    for (let i = 0; i < 8; i++) {
        // if you're wondering, yes the .fill(0) here is needed, its just javascrpipt being weird
        res.push(new Array(8).fill(0).map(v => PieceType.empty));
    }
    return res as PiecesMap;
}

function generateDom() {
    const lettersArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const tobdyEl = TableDomEl.firstElementChild as HTMLElement;
    const domElementsMap = new Array(size).fill(0).map(() => new Array(size));
    // -1 because we want to add another row for the letters and numbers on the left and top
    for (let y = -1; y < size; y++) {
        const trEl = document.createElement('tr');

        if (y === -1) {
            trEl.id = "chess_letters";

            for (let i = 0; i <= size; i++) {
                const tdEl = document.createElement('td');

                tdEl.classList.add('chess_letter');
                tdEl.classList.add('chess_key');

                if (i === 0) {
                    tdEl.classList.add('empty_chess_letter');
                    tdEl.innerHTML = " "
                } else {
                    tdEl.innerHTML = lettersArray[i - 1];
                }

                trEl.appendChild(tdEl);
            }
            tobdyEl.appendChild(trEl);

            continue;
        }

        trEl.classList.add('chess_row');
        // -1 for the same reason
        for (let x = -1; x < size; x++) {
            const tdEl = document.createElement('td');

            if (x === -1) {
                tdEl.classList.add('chess_number');
                tdEl.classList.add('chess_key');
                tdEl.innerHTML = playingSide === 1 ? y + 1 + "" : Math.abs(y - size) + "";
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
    return domElementsMap as HTMLTableDataCellElement[][];
}

function initBasicPieces(playSide: 0 | 1): PiecesMap {
    const res: PiecesMap = [
        [BROOK, BKING, BBISHOP, BQUEEN, BKING, BBISHOP, BKNIGHT, BROOK],
        [BPAWN, BPAWN, BPAWN, BPAWN, BPAWN, BPAWN, BPAWN, BPAWN, ],
        [PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, ],
        [PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, ],
        [PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, ],
        [PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, PEMPTY, ],
        [WPAWN, WPAWN, WPAWN, WPAWN, WPAWN, WPAWN, WPAWN, WPAWN, ],
        [WROOK, WKING, WBISHOP, WQUEEN, WKING, WBISHOP, WKNIGHT, WROOK]
    ];
    return playSide ? res.reverse() as PiecesMap : res;
}

function updatePieceDom(pm: PiecesMap) {
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            if (pm[x][y] === PieceType.empty) continue;
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('chess_piece');
            pieceElement.classList.add(`chess_piece_${PieceType[(pm[x][y] as NotEmptyPiece).type]}`);
            pieceElement.classList.add(`chess_piece_${(pm[x][y] as NotEmptyPiece).color}`)
            const chessSlot = chessDomMap[x][y];
            while (chessSlot.childElementCount > 0) {
                chessSlot.removeChild(chessSlot.firstElementChild as HTMLElement);
            }
            chessSlot.appendChild(pieceElement);
        }
    }
}