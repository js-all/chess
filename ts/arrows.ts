const ctx = canvasOverlay.getContext('2d') as CanvasRenderingContext2D;
const arrows = [];

interface ArrowStyle {
    outline: string,
    fill: string,
    twoWay: boolean
}

class Arrow {
    static ActiveArrows: Set<Arrow> = new Set();
    startPos: Vector;
    endPos: Vector;
    pathDirrect: boolean;
    style: ArrowStyle;
    uuid: string = uuid4();
    constructor(startPos: Vector, endPos: Vector, pathDirrect: boolean, style: ArrowStyle) {
        this.startPos = startPos;
        this.endPos = endPos;
        this.pathDirrect = pathDirrect;
        this.style = style;
        Arrow.ActiveArrows.add(this);
    }

    draw(ctx: CanvasRenderingContext2D) {
        // don't render if the arrows points to itself (causes and error with the gradient)
        if(this.startPos.equals(this.endPos)) return;
        ctx.lineWidth = 3;
        if (this.pathDirrect) {
            const dirVector = this.endPos.substract(this.startPos).unit();
            const cwPerpDirVector = dirVector.perpendicular();
            const centerStartPos = this.startPos.add(.5);
            const centerEndPos = this.endPos.add(.5);
            const size = 5;
            const arrowLength = 3;
            const arrowThickness = 1.5;
            const gradientEnd = 1;
            const gradientStartOffset = 1;
            const arrowLengthReduction = .5;
            {   
                const arrowLength = centerEndPos.substract(centerStartPos).length() - arrowLengthReduction;
                const cnvCoordStart = ChessToCanvasCoordinates(centerStartPos.substract(dirVector.multiply(gradientStartOffset)));
                const cnvCoordEnd = ChessToCanvasCoordinates(centerStartPos.add(dirVector.multiply(arrowLength / gradientEnd)));
                const strokeGradient = ctx.createLinearGradient(cnvCoordStart.x, cnvCoordStart.y, cnvCoordEnd.x, cnvCoordEnd.y);
                const fillGradient = ctx.createLinearGradient(cnvCoordStart.x, cnvCoordStart.y, cnvCoordEnd.x, cnvCoordEnd.y);
                strokeGradient.addColorStop(0, "transparent");
                strokeGradient.addColorStop(1, this.style.outline);
                fillGradient.addColorStop(0, "transparent");
                fillGradient.addColorStop(1, this.style.fill);
                ctx.fillStyle = fillGradient;
                ctx.strokeStyle = strokeGradient;
            }
            ctx.beginPath();
            ctx.moveTo(...(ChessToCanvasCoordinates(centerStartPos.substract(cwPerpDirVector.divide(size))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVector.multiply(arrowLengthReduction)).substract(cwPerpDirVector.divide(size))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVector.multiply(arrowLengthReduction)).substract(cwPerpDirVector.divide(size).multiply(arrowThickness))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVector.multiply(arrowLengthReduction / arrowLength))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVector.multiply(arrowLengthReduction)).add(cwPerpDirVector.divide(size).multiply(arrowThickness))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVector.multiply(arrowLengthReduction)).add(cwPerpDirVector.divide(size))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerStartPos.add(cwPerpDirVector.divide(size))).toArray()));
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
        } else {

        }
    }

    static renderArrows(ctx: CanvasRenderingContext2D) {
        Arrow.ActiveArrows.forEach(v => {
            v.draw(ctx);
        });
    }

    destroy() {
        Arrow.ActiveArrows.delete(this);
    }
}

{
    function draw() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        Arrow.renderArrows(ctx);
        requestAnimationFrame(draw);
    }
    draw();
}

function getCanvasChessUnits() {
    const tileClienRect = chessDomMap[0][0].getBoundingClientRect();
    return new Vector(tileClienRect.width, tileClienRect.height);
}

function ChessToCanvasCoordinates(chessCoord: Vector): Vector {
    const unit = getCanvasChessUnits();
    const cc = chessCoord.add(1);
    return cc.multiply(unit);
}

let arrow = new Arrow(new Vector(0, 0), new Vector(0, 0), true, { fill: "rgba(255, 255, 255, 0.5)", outline: "rgba(0, 0, 0, 0.5)", twoWay:false });

function onSlotClick(pos: Vector, start = true) {
    if(!start) {
        arrow.endPos = pos;
    } else {
        arrow.startPos = pos;
    }

}

for(let y = 0; y < 8; y++) {
    for(let x = 0; x < 8; x++) {
        chessDomMap[y][x].addEventListener('mousedown', e => {onSlotClick(new Vector(x, y), e.button===2)});
        chessDomMap[y][x].addEventListener("contextmenu", e => {e.preventDefault()});
    }
}