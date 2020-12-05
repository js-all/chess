
const ctx = canvasOverlay.getContext('2d') as CanvasRenderingContext2D;
const arrows = [];

interface ArrowStyle {
    outline: string,
    fill: string,
    twoWay: boolean
}

class Arrow {
    static DrawLogs: Map<string, Map<string, string>> = new Map();
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
        Arrow.DrawLogs.set(this.uuid, new Map());
    }
    /**
     * draw the arrow
     * @param ctx the canavas' context
     * 
     * I should not be legally authorized to code with canvas
     */
    draw(ctx: CanvasRenderingContext2D) {
        const Logs = Arrow.DrawLogs.get(this.uuid) as Map<string, string>;
        Logs.set("test", "value");
        // don't render if the arrows points to itself (causes and error with the gradient)
        if (this.startPos.equals(this.endPos)) return;
        ctx.lineWidth = 3;

        const centerStartPos = this.startPos.add(.5);
        const centerEndPos = this.endPos.add(.5);
        const arrowLengthReduction = .5;

        if (this.pathDirrect) {
            const dirVector = this.endPos.substract(this.startPos).unit();
            const cwPerpDirVector = dirVector.perpendicular();
            const size = 5;
            const arrowLength = 3;
            const arrowThickness = 1.5;
            const gradientEnd = 1;
            const gradientStartOffset = 1;
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
            ctx.fillStyle = this.style.fill;
            ctx.strokeStyle = "red";
            const vecFromStartToEnd = this.endPos.substract(this.startPos);
            // create a vector with the largest component of vecFromStartToEnd.
            const dirVec1 = Math.abs(vecFromStartToEnd.x) > Math.abs(vecFromStartToEnd.y) ? new Vector(vecFromStartToEnd.x, 0) : new Vector(0, vecFromStartToEnd.y);
            const CWperpendicularDirVec1 = dirVec1.perpendicular().unit();
            const firstEndPos = this.startPos.add(dirVec1);
            const firstEndPosCenter = firstEndPos.add(.5);
            // create a vector with the smallest component of vecFromStartToEnd.
            const dirVec2 = Math.abs(vecFromStartToEnd.x) < Math.abs(vecFromStartToEnd.y) ? new Vector(vecFromStartToEnd.x, 0) : new Vector(0, vecFromStartToEnd.y);
            const CWperpendicularDirVec2 = dirVec2.perpendicular().unit();

            ctx.beginPath();
            ctx.moveTo(...(ChessToCanvasCoordinates(centerStartPos.substract(CWperpendicularDirVec1.divide(size))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(firstEndPosCenter.substract(CWperpendicularDirVec1.divide(size))).toArray()));
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        }
    }

    static renderArrows(ctx: CanvasRenderingContext2D, logs = false) {
        Arrow.ActiveArrows.forEach(v => {
            v.draw(ctx);
        });
        if (logs) {
            let logStrings: string[] = [];
            let newLines = 0;
            Arrow.DrawLogs.forEach((v, k) => {

                if (v.size > 0) {
                    // adding letters at the start to remove them later and know what type of line it is
                    logStrings.push("N", "N" + k + ":");
                    newLines++;
                    v.forEach((lv, lk) => {
                        logStrings.push("L    " + lk + ": " + lv);
                        newLines++;
                    });
                }
            });
            logStrings.splice(0, 1);
            ctx.font = `${getCanvasChessUnits().x / 6}px Consolas`
            let maxWidth = 0;
            let totalHeight = 20;
            const LogsWithTopOffset: {text: string, offset: number, type: "uuid" | "property" | "other"}[] = logStrings.map(v => {
                const type = v[0] === "N" ? "uuid" : v[0] === "L" ? "property" : "other";
                const metrics = ctx.measureText(v);
                const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 8;
                totalHeight += height
                if(maxWidth < metrics.width) maxWidth = metrics.width;
                return {
                    text: v.substring(1),
                    offset: height,
                    type: type
                }
            });

            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.fillRect(0, 0, maxWidth + 20, totalHeight);
            let actualOffset = 20;
            for (let i = 0; i < LogsWithTopOffset.length; i++) {
                const stringWithOffset = LogsWithTopOffset[i];
                ctx.fillStyle = stringWithOffset.type === "uuid" ? "rgb(0, 153, 255)" : stringWithOffset.type === "property" ? "white" : "rgba(255, 255, 255, 0.5)";
                ctx.fillText(stringWithOffset.text, 10, actualOffset);
                actualOffset += stringWithOffset.offset;
            }

        }
    }

    destroy() {
        Arrow.ActiveArrows.delete(this);
    }
}

{
    function draw() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        Arrow.renderArrows(ctx, true);
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

let arrow = new Arrow(new Vector(0, 0), new Vector(0, 0), true, { fill: "rgba(255, 255, 255, 0.5)", outline: "rgba(0, 0, 0, 0.5)", twoWay: false });
let arrow2 = new Arrow(new Vector(0, 0), new Vector(0, 0), false, { fill: "rgba(255, 255, 255, 0.5)", outline: "rgba(0, 0, 0, 0.5)", twoWay: false });


function onSlotClick(pos: Vector, start = true) {
    if (!start) {
        arrow.endPos = pos;
        arrow2.endPos = pos;
    } else {
        arrow.startPos = pos;
        arrow2.startPos = pos;
    }

}

for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
        chessDomMap[y][x].addEventListener('mousedown', e => { onSlotClick(new Vector(x, y), e.button === 2) });
        chessDomMap[y][x].addEventListener("contextmenu", e => { e.preventDefault() });
    }
}