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

type Piece = NotEmptyPiece | PieceType.empty;

// move
type MoveType = "move" | "capture";

interface Move {
    performFrom: Vector,
    performOnto: Vector,
    type: MoveType,
    checking: Vector | null
}
interface GameMetadata {
    playingSide: 0 | 1;
    playerTurn: 0 | 1;
}

type BezierOutput = "point" | "y coordinate" | "x coordinate" | "length from start";

type BezierCurveData = BezierCurveDataLength | BezierCurveDataPoint | BezierCurveDataXCoord | BezierCurveDataYCoord

interface BezierCurveDataPoint {
    points: {
        p1: Vector,
        p2: Vector,
        p3: Vector,
        p4: Vector
    },
    component: "point"
}
interface BezierCurveDataYCoord {
    points: {
        p1: Vector,
        p2: Vector,
        p3: Vector,
        p4: Vector
    },
    component: "y coordinate"
}
interface BezierCurveDataXCoord {
    points: {
        p1: Vector,
        p2: Vector,
        p3: Vector,
        p4: Vector
    },
    component: "x coordinate"
}
interface BezierCurveDataLength {
    points: {
        p1: Vector,
        p2: Vector,
        p3: Vector,
        p4: Vector
    },
    component: "length from start"
}

interface ArrowStyle {
    outline: string,
    fill: string
}

interface ArrowState {
    startPos: Vector,
    endPos: Vector
}

interface TransitionArrowState {
    startPos: Vector | null,
    endPos: Vector | null
}