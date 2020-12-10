
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