const ctx = canvasOverlay.getContext('2d') as CanvasRenderingContext2D;
const arrows = [];

interface ArrowStyle {
    outline: string,
    fill: string,
    twoWay: boolean
}

class Arrow {
    /**
     * Logs for arrows, will display the uuid of the logging object and its "properties under it", like that:
     * ```
     * 4f996f47-c946-4ed6-b3ed-f4ef4fc6db56:
     *     Path: dirrect
     *     otherProperty: otherValue
     * 
     * other-uuid:
     *     property: value
     * ```
     * you can set Logs by first getting the log map of the arrow you want
     * 
     * `const Log = Arrow.Drawlogs.get(arrow_you_want.uuid);`
     * 
     * then you can add properties this way:
     * 
     * `Log.set("property name", "property value");`
     * 
     * if you want to add color (chose one of the letter in the []):
     * 
     * `Log.set("C[UPOYWRM]property name", "property value");`
     * 
     * if your property start with a C
     * 
     * `Log.set("\\C starting property name", "value");`
     * 
     * Colors:
     *  - U: blue
     *  - P: white
     *  - O: grey
     *  - Y: yellow
     *  - W: orange
     *  - R: red
     *  - M: magenta
     * 
     * @type Map<uuid, Map<propertyName, propertyValue>>
     */
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
        // don't render if the arrows points to itself (causes and error with the gradient)
        if (this.startPos.equals(this.endPos)) return;
        ctx.lineWidth = 3;

        const centerStartPos = this.startPos.add(.5);
        const centerEndPos = this.endPos.add(.5);
        const arrowLengthReduction = .5;
        const vecFromStartToEnd = this.endPos.substract(this.startPos);
        const size = 5;
        const TipOfArrowThickness = 1.5;
        const arrowLength = 3;
        const gradientStartOffset = 1;
        const gradientEnd = 1;

        Logs.set("CWPath", this.pathDirrect ? "dirrect" : "corner")

        if (this.pathDirrect || vecFromStartToEnd.x === 0 || vecFromStartToEnd.y === 0) {
            const dirVector = this.endPos.substract(this.startPos).unit();
            const cwPerpDirVector = dirVector.perpendicular();
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
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVector.multiply(arrowLengthReduction)).substract(cwPerpDirVector.divide(size).multiply(TipOfArrowThickness))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVector.multiply(arrowLengthReduction / arrowLength))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVector.multiply(arrowLengthReduction)).add(cwPerpDirVector.divide(size).multiply(TipOfArrowThickness))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVector.multiply(arrowLengthReduction)).add(cwPerpDirVector.divide(size))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerStartPos.add(cwPerpDirVector.divide(size))).toArray()));
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
        } else {
            // create a vector with the largest component of vecFromStartToEnd.
            const dirVec1 = Math.abs(vecFromStartToEnd.x) > Math.abs(vecFromStartToEnd.y) ? new Vector(vecFromStartToEnd.x, 0) : new Vector(0, vecFromStartToEnd.y);
            const CWperpendicularDirVec1 = dirVec1.perpendicular().unit();
            const firstEndPos = this.startPos.add(dirVec1);
            const firstEndPosCenter = firstEndPos.add(.5);
            // create a vector with the smallest component of vecFromStartToEnd. (<= here to not find  the same vector twice)
            const dirVec2 = Math.abs(vecFromStartToEnd.x) <= Math.abs(vecFromStartToEnd.y) ? new Vector(vecFromStartToEnd.x, 0) : new Vector(0, vecFromStartToEnd.y);
            const CWperpendicularDirVec2 = dirVec2.perpendicular().unit();
            const arrowThickness = CWperpendicularDirVec1.divide(size).length() * 2;
            const secondStartPosCenter = firstEndPos.add(dirVec2.unit().multiply(arrowThickness / 2)).add(.5);

            {
                const arrowLength = firstEndPosCenter.substract(centerStartPos).length() - arrowLengthReduction;
                const cnvCoordStart = ChessToCanvasCoordinates(centerStartPos.substract(dirVec1.unit().multiply(gradientStartOffset)));
                const cnvCoordEnd = ChessToCanvasCoordinates(centerStartPos.add(dirVec1.unit().multiply(arrowLength / gradientEnd)));
                const strokeGradient = ctx.createLinearGradient(cnvCoordStart.x, cnvCoordStart.y, cnvCoordEnd.x, cnvCoordEnd.y);
                const fillGradient = ctx.createLinearGradient(cnvCoordStart.x, cnvCoordStart.y, cnvCoordEnd.x, cnvCoordEnd.y);
                strokeGradient.addColorStop(0, "transparent");
                strokeGradient.addColorStop(1, this.style.outline);
                fillGradient.addColorStop(0, "transparent");
                fillGradient.addColorStop(1, this.style.fill);
                ctx.fillStyle = fillGradient;
                ctx.strokeStyle = strokeGradient;
            }
            
            // to know on chich side the corner is
            const dot = CWperpendicularDirVec1.dot(dirVec2);
            //(dot / Math.abs(dot)) to get -1 or 1 depending on the sign of the dot, -x/|x| = -1 x/|x| = 1 (whith x positive)
            const orientation = dot / Math.abs(dot);
            const arcCoord = ChessToCanvasCoordinates(firstEndPosCenter.substract(dirVec1.unit().multiply(arrowThickness/2)).add(CWperpendicularDirVec1.divide(size * orientation)));
            const canvasChessUnits = getCanvasChessUnits();

            ctx.beginPath();
            ctx.ellipse(arcCoord.x, arcCoord.y, canvasChessUnits.x * arrowThickness, canvasChessUnits.y * arrowThickness, 0, CWperpendicularDirVec1.toAngle() + Math.PI / 2 * ((orientation + 1) / 2), CWperpendicularDirVec2.toAngle() - Math.PI / 2  * ((orientation + 1) / 2)) ;
            ctx.stroke();
            ctx.moveTo(arcCoord.x, arcCoord.y);
            ctx.ellipse(arcCoord.x, arcCoord.y, canvasChessUnits.x * arrowThickness, canvasChessUnits.y * arrowThickness, 0, CWperpendicularDirVec1.toAngle() + Math.PI / 2 * ((orientation + 1) / 2), CWperpendicularDirVec2.toAngle() - Math.PI / 2  * ((orientation + 1) / 2)) ;
            ctx.fill();
            ctx.closePath();

            ctx.beginPath();
            ctx.moveTo(...(ChessToCanvasCoordinates(centerStartPos.substract(CWperpendicularDirVec1.divide(size))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(firstEndPosCenter.substract(dirVec1.unit().multiply(arrowThickness/2)).substract(CWperpendicularDirVec1.divide(size))).toArray()));
            ctx.moveTo(...(ChessToCanvasCoordinates(firstEndPosCenter.substract(dirVec1.unit().multiply(arrowThickness/2)).add(CWperpendicularDirVec1.divide(size))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerStartPos.add(CWperpendicularDirVec1.divide(size))).toArray()));
            ctx.stroke();
            ctx.lineTo(...(ChessToCanvasCoordinates(centerStartPos.substract(CWperpendicularDirVec1.divide(size))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(firstEndPosCenter.substract(dirVec1.unit().multiply(arrowThickness/2)).substract(CWperpendicularDirVec1.divide(size))).toArray()));
            ctx.fill();
            ctx.closePath();


            ctx.beginPath();
            ctx.moveTo(...(ChessToCanvasCoordinates(secondStartPosCenter.substract(CWperpendicularDirVec2.divide(size))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVec2.unit().multiply(arrowLengthReduction)).substract(CWperpendicularDirVec2.divide(size))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVec2.unit().multiply(arrowLengthReduction)).substract(CWperpendicularDirVec2.divide(size).multiply(TipOfArrowThickness))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVec2.unit().multiply(arrowLengthReduction / arrowLength))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVec2.unit().multiply(arrowLengthReduction)).add(CWperpendicularDirVec2.divide(size).multiply(TipOfArrowThickness))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVec2.unit().multiply(arrowLengthReduction)).add(CWperpendicularDirVec2.divide(size))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(secondStartPosCenter.add(CWperpendicularDirVec2.divide(size))).toArray()));
            ctx.stroke();
            ctx.lineTo(...(ChessToCanvasCoordinates(secondStartPosCenter.substract(CWperpendicularDirVec2.divide(size))).toArray()));
            ctx.lineTo(...(ChessToCanvasCoordinates(centerEndPos.substract(dirVec2.unit().multiply(arrowLengthReduction)).substract(CWperpendicularDirVec2.divide(size))).toArray()));
            ctx.fill();
            ctx.closePath();

            Logs.set("dir vec 1", dirVec1.toString());
            Logs.set("dir vec 2", dirVec2.toString());
        }
    }

    static renderArrows(ctx: CanvasRenderingContext2D, logs = false) {
        Arrow.ActiveArrows.forEach(v => {
            v.draw(ctx);
        });
        let logsAreEmpty = true;
        logs && Arrow.DrawLogs.forEach(v => logsAreEmpty = logsAreEmpty && v.size < 1);
        if (logs && !logsAreEmpty) {
            const Colors = {
                U: "rgb(0, 153, 255)",
                P: "rgb(255, 255, 255)",
                O: "rgb(128, 128, 128)",
                Y: "rgb(255, 204, 0)",
                W: "rgb(255, 115, 0)",
                R: "rgb(255, 0, 0)",
                M: "rgb(255, 0, 162)"
            }
            let logStrings: string[] = [];
            Arrow.DrawLogs.forEach((v, k) => {

                if (v.size > 0) {
                    // adding letters at the start to remove them later and know what type of line it is
                    logStrings.push("U", "U" + k + ":");
                    v.forEach((lv, lk) => {
                        let strk = "";
                        if(lk[0] === "\\" && lk[1] === "C") {strk = "P    "+lk.substring(1);}
                        else if(lk[0] === "C") {strk = lk[1] + "    " + lk.substring(2);}
                        else {strk = "P    " + lk;}
                        logStrings.push(strk + ": " + lv);
                    });
                }
            });
            logStrings.splice(0, 1);
            ctx.font = `${getCanvasChessUnits().x / 6}px Consolas`
            let maxWidth = 0;
            let totalHeight = 20;
            const LogsWithTopOffset = logStrings.map(v => {
                const color = v[0];
                const metrics = ctx.measureText(v);
                const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 8;
                totalHeight += height
                if(maxWidth < metrics.width) maxWidth = metrics.width;
                return {
                    text: v.substring(1),
                    offset: height,
                    color: color
                }
            });
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, maxWidth + 20, totalHeight);
            let actualOffset = 20;
            for (let i = 0; i < LogsWithTopOffset.length; i++) {
                const stringWithOffset = LogsWithTopOffset[i];
                ///@ts-expect-error
                ctx.fillStyle = Colors[stringWithOffset.color] || "white";
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
new Arrow(new Vector(0, 0), new Vector(2, 5), false, { fill: "rgba(255, 255, 255, 0.5)", outline: "rgba(0, 0, 0, 0.5)", twoWay: false });


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
