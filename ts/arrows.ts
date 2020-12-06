const canvasOverlay = document.querySelector("#arrow_canvas") as HTMLCanvasElement;
const ctx = canvasOverlay.getContext('2d') as CanvasRenderingContext2D;
let showLogs = true;
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
    /**
     * all actively drawn arrows
     */
    static ActiveArrows: Set<Arrow> = new Set();
    static DefaultSyles = {
        move: {
            outline: "transparent",
            fill: "rgb(200, 200, 200)"
        },
        wrong: {
            outline: "transparent",
            fill: "rgba(200, 0, 0)"
        },
        capture: {
            outline: "rgb(200, 0, 0)",
            fill: "rgba(200, 200, 200)"
        },
        custom: {
            outline: "transparent",
            fill: "rgba(255, 90, 0, .8)"
        },
        check: {
            outline: "rgba(0, 0, 0, 0.7)",
            fill: "transparent"
        }
    };
    startPos: Vector;
    endPos: Vector;
    pathDirrect: boolean;
    style: ArrowStyle;
    uuid: string = uuid4();
    transitionStartDate = new Date(0);
    transitionDuration = 100;
    transitionFromState: ArrowState;
    transitionToState: TransitionArrowState;
    transitionBezierCurve: BezierCurveData;


    /**
     * 
     * @param startPos the Arrow's start position (in chess coordinates)
     * @param endPos the Arrow's end postion (in chess coordiantes)
     * @param pathDirrect if the arrows goes straight to its end postion or take turns
     * @param style define the style of the arrow
     */
    constructor(startPos: Vector, endPos: Vector, pathDirrect: boolean, style: ArrowStyle, transitionBezierCurve: BezierCurveData = {
        points: {
            p1: new Vector(0, 0),
            p2: new Vector(0, 0),
            p3: new Vector(0, 1),
            p4: new Vector(0, 1)
        },
        component: "y coordinate"
    }) {
        this.startPos = startPos;
        this.endPos = endPos;
        this.pathDirrect = pathDirrect;
        this.style = style;
        this.transitionFromState = {
            endPos: endPos,
            startPos: startPos
        };
        this.transitionToState = {
            endPos: endPos,
            startPos: startPos
        };
        this.transitionBezierCurve = transitionBezierCurve;

        Arrow.ActiveArrows.add(this);
        Arrow.DrawLogs.set(this.uuid, new Map());
    }
    getActualState(): ArrowState {
        return {
            startPos: this.startPos.clone(),
            endPos: this.endPos.clone()
        }
    }
    setActualState(state: TransitionArrowState) {
        this.startPos = state.startPos === null ? this.startPos : state.startPos.clone();
        this.endPos = state.endPos === null ? this.endPos : state.endPos.clone();
    }
    interpolateTo(state: TransitionArrowState) {
        // if((new Date().getTime() - this.transitionStartDate.getTime()) / this.transitionDuration >= 1) {
            this.transitionFromState = this.getActualState();
            this.transitionStartDate = new Date();
        // }
        this.transitionToState = state;
    }
    resetInterpolation() {
        this.transitionStartDate = new Date(0);
        this.transitionFromState = this.getActualState();
        this.transitionToState = this.getActualState();
    }
    /**
     * draw the arrow
     * @param ctx the canavas' context
     * 
     * I should not be legally authorized to code with canvas
     */
    draw(ctx: CanvasRenderingContext2D) {
        const Logs = Arrow.DrawLogs.get(this.uuid) as Map<string, string>;

        let transitionFactor = (new Date().getTime() - this.transitionStartDate.getTime()) / this.transitionDuration;
        transitionFactor = transitionFactor > 1 ? 1 : transitionFactor;

        
        
        //@ts-expect-error
        const bezierFactor = bezierInterpolation(this.transitionBezierCurve, transitionFactor) as number;
        if (this.transitionToState.startPos !== null) {
            this.startPos = Vector.lerp(this.transitionFromState.startPos, this.transitionToState.startPos, bezierFactor);
        }
        if (this.transitionToState.endPos !== null) {
            this.endPos = Vector.lerp(this.transitionFromState.endPos, this.transitionToState.endPos, bezierFactor);
        }
        
        Logs.set("bezier factor", bezierFactor + "");
        Logs.set("factor", transitionFactor + "");

        // don't render if the arrows points to itself (causes and error with the gradient)
        if (this.startPos.equals(this.endPos)) return;


        const centerStartPos = this.startPos.add(.5);
        const centerEndPos = this.endPos.add(.5);
        const vecFromStartToEnd = this.endPos.substract(this.startPos);
        const thickness = 5;
        const tipOfArrowLength = .3;
        const arrowLengthReduction = .3;
        const TipOfArrowThickness = 1.5;
        const gradientStartOffset = 2;
        const gradientEnd = 1;
        const units = getChessToRealCoordUnits();

        //don't render if the arrow is too short either because the tip clip with the shaft otherwise
        if (vecFromStartToEnd.length() < 0.3) return;

        ctx.lineWidth = units.x / 15;

        /**
         * shorthand for
         * ```ts
         * ChessToRealCoordinates(..., units).toArray();
         * ```
         * @param v vector
         */
        const CTRCTA = (v: Vector) => ChessToRealCoordinates(v, units).toArray();

        const makeArrowColorGradient = (centerStartPoint: Vector, unitDirVector: Vector, centerEndPoint: Vector) => {
            const arrowLength = centerEndPoint.substract(centerStartPoint).length() - arrowLengthReduction;
            const cnvCoordStart = ChessToRealCoordinates(centerStartPoint.substract(unitDirVector.multiply(gradientStartOffset)));
            const cnvCoordEnd = ChessToRealCoordinates(centerStartPoint.add(unitDirVector.multiply(arrowLength / gradientEnd)));
            const strokeGradient = ctx.createLinearGradient(cnvCoordStart.x, cnvCoordStart.y, cnvCoordEnd.x, cnvCoordEnd.y);
            const fillGradient = ctx.createLinearGradient(cnvCoordStart.x, cnvCoordStart.y, cnvCoordEnd.x, cnvCoordEnd.y);

            strokeGradient.addColorStop(0, "transparent");
            strokeGradient.addColorStop(1, this.style.outline);
            fillGradient.addColorStop(0, "transparent");
            fillGradient.addColorStop(1, this.style.fill);

            ctx.fillStyle = fillGradient;
            ctx.strokeStyle = strokeGradient;
        }

        // render dirrect even if arrow is not if it goes straight from start to end on a single axis (avoid rendering corner)
        if (this.pathDirrect || vecFromStartToEnd.x === 0 || vecFromStartToEnd.y === 0) {

            const dirVector = this.endPos.substract(this.startPos).unit();
            const CWPerpendicularDirVector = dirVector.perpendicular();
            const CWPerpendicularDirVectorOverThickness = CWPerpendicularDirVector.divide(thickness)
            const centerEndPosWithLengthReduction = centerEndPos.substract(dirVector.multiply(arrowLengthReduction));

            makeArrowColorGradient(centerStartPos, dirVector, centerEndPos);

            ctx.beginPath();
            ctx.moveTo(...CTRCTA(centerStartPos.substract(CWPerpendicularDirVectorOverThickness)));
            ctx.lineTo(...CTRCTA(centerEndPosWithLengthReduction.substract(CWPerpendicularDirVectorOverThickness)));
            ctx.lineTo(...CTRCTA(centerEndPosWithLengthReduction.substract(CWPerpendicularDirVector.divide(thickness).multiply(TipOfArrowThickness))));
            ctx.lineTo(...CTRCTA(centerEndPos.substract(dirVector.multiply(arrowLengthReduction - tipOfArrowLength))));
            ctx.lineTo(...CTRCTA(centerEndPosWithLengthReduction.add(CWPerpendicularDirVector.divide(thickness).multiply(TipOfArrowThickness))));
            ctx.lineTo(...CTRCTA(centerEndPosWithLengthReduction.add(CWPerpendicularDirVectorOverThickness)));
            ctx.lineTo(...CTRCTA(centerStartPos.add(CWPerpendicularDirVectorOverThickness)));
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
        } else {
            // create a vector with the largest component of vecFromStartToEnd.
            const dirVec1 = Math.abs(vecFromStartToEnd.x) > Math.abs(vecFromStartToEnd.y) ? new Vector(vecFromStartToEnd.x, 0) : new Vector(0, vecFromStartToEnd.y);
            const dirVec1U = dirVec1.unit();
            const CWperpendicularDirVec1 = dirVec1.perpendicular().unit();
            const firstEndPos = this.startPos.add(dirVec1);
            const centerFirstEndPos = firstEndPos.add(.5);

            // create a vector with the smallest component of vecFromStartToEnd. (<= here to not find  the same vector twice)
            const dirVec2 = Math.abs(vecFromStartToEnd.x) <= Math.abs(vecFromStartToEnd.y) ? new Vector(vecFromStartToEnd.x, 0) : new Vector(0, vecFromStartToEnd.y);
            const dirVec2U = dirVec2.unit();
            const CWperpendicularDirVec2 = dirVec2.perpendicular().unit();
            const arrowThickness = CWperpendicularDirVec1.divide(thickness).length() * 2;
            const secondStartPosCenter = firstEndPos.add(dirVec2U.multiply(arrowThickness / 2)).add(.5);

            makeArrowColorGradient(centerStartPos, dirVec1U, centerFirstEndPos);

            // to know on which side the corner is
            const dot = CWperpendicularDirVec1.dot(dirVec2);
            //(dot / Math.abs(dot)) to get -1 or 1 depending on the sign of the dot, -x/|x| = -1 x/|x| = 1 (whith x positive)
            const orientation = dot / Math.abs(dot);
            const arcCoord = ChessToRealCoordinates(centerFirstEndPos.substract(dirVec1U.multiply(arrowThickness / 2)).add(CWperpendicularDirVec1.divide(thickness * orientation)), units);


            //draw the rounded corner
            ctx.beginPath();
            ctx.ellipse(arcCoord.x, arcCoord.y, units.x * arrowThickness, units.y * arrowThickness, 0, CWperpendicularDirVec1.toAngle() + Math.PI / 2 * ((orientation + 1) / 2), CWperpendicularDirVec2.toAngle() - Math.PI / 2 * ((orientation + 1) / 2));
            ctx.stroke();
            ctx.moveTo(arcCoord.x, arcCoord.y);
            ctx.ellipse(arcCoord.x, arcCoord.y, units.x * arrowThickness, units.y * arrowThickness, 0, CWperpendicularDirVec1.toAngle() + Math.PI / 2 * ((orientation + 1) / 2), CWperpendicularDirVec2.toAngle() - Math.PI / 2 * ((orientation + 1) / 2));
            ctx.fill();
            ctx.closePath();

            // draw the first shaft
            ctx.beginPath();
            ctx.moveTo(...CTRCTA(centerStartPos.substract(CWperpendicularDirVec1.divide(thickness))));
            ctx.lineTo(...CTRCTA(centerFirstEndPos.substract(dirVec1U.multiply(arrowThickness / 2)).substract(CWperpendicularDirVec1.divide(thickness))));
            ctx.moveTo(...CTRCTA(centerFirstEndPos.substract(dirVec1U.multiply(arrowThickness / 2)).add(CWperpendicularDirVec1.divide(thickness))));
            ctx.lineTo(...CTRCTA(centerStartPos.add(CWperpendicularDirVec1.divide(thickness))));
            ctx.stroke();
            ctx.lineTo(...CTRCTA(centerStartPos.substract(CWperpendicularDirVec1.divide(thickness))));
            ctx.lineTo(...CTRCTA(centerFirstEndPos.substract(dirVec1U.multiply(arrowThickness / 2)).substract(CWperpendicularDirVec1.divide(thickness))));
            ctx.fill();
            ctx.closePath();

            // the second shaft with the tip of the arrow
            ctx.beginPath();
            ctx.moveTo(...CTRCTA(secondStartPosCenter.substract(CWperpendicularDirVec2.divide(thickness))));
            ctx.lineTo(...CTRCTA(centerEndPos.substract(dirVec2U.multiply(arrowLengthReduction)).substract(CWperpendicularDirVec2.divide(thickness))));
            ctx.lineTo(...CTRCTA(centerEndPos.substract(dirVec2U.multiply(arrowLengthReduction)).substract(CWperpendicularDirVec2.divide(thickness).multiply(TipOfArrowThickness))));
            ctx.lineTo(...CTRCTA(centerEndPos.substract(dirVec2U.multiply(arrowLengthReduction - tipOfArrowLength))));
            ctx.lineTo(...CTRCTA(centerEndPos.substract(dirVec2U.multiply(arrowLengthReduction)).add(CWperpendicularDirVec2.divide(thickness).multiply(TipOfArrowThickness))));
            ctx.lineTo(...CTRCTA(centerEndPos.substract(dirVec2U.multiply(arrowLengthReduction)).add(CWperpendicularDirVec2.divide(thickness))));
            ctx.lineTo(...CTRCTA(secondStartPosCenter.add(CWperpendicularDirVec2.divide(thickness))));
            ctx.stroke();
            ctx.lineTo(...CTRCTA(secondStartPosCenter.substract(CWperpendicularDirVec2.divide(thickness))));
            ctx.lineTo(...CTRCTA(centerEndPos.substract(dirVec2U.multiply(arrowLengthReduction)).substract(CWperpendicularDirVec2.divide(thickness))));
            ctx.fill();
            ctx.closePath();
        }
    }
    static renderLogs() {
        // test if logs are empty
        let logsAreEmpty = true;
        Arrow.DrawLogs.forEach(v => logsAreEmpty = logsAreEmpty && v.size < 1);
        if (!logsAreEmpty) {
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
                // otherwise don't add the name or any logs
                if (v.size > 0) {
                    // adding letters at the start to remove them later and know what color it should be
                    // add two line with the name
                    logStrings.push("U", "U" + k + ":");

                    v.forEach((lv, lk) => {
                        let strk = "";
                        //deal with color
                        if (lk[0] === "\\" && lk[1] === "C") { strk = "P    " + lk.substring(1); }
                        else if (lk[0] === "C") { strk = lk[1] + "    " + lk.substring(2); }
                        else { strk = "P    " + lk; }
                        // push the string
                        logStrings.push(strk + ": " + lv);
                    });
                }
            });
            // remove first blank line
            logStrings.splice(0, 1);
            ctx.font = `${getChessToRealCoordUnits().x / 6}px Consolas`
            // to make the background black box the right size
            let maxWidth = 0;
            let totalHeight = 20;

            const LogsWithTopOffset = logStrings.map(v => {
                const color = v[0];
                const metrics = ctx.measureText(v);
                // + 8 for line height
                const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 8;
                totalHeight += height
                if (maxWidth < metrics.width) maxWidth = metrics.width;
                return {
                    // rmeove first chr as it is already stored in color
                    text: v.substring(1),
                    offset: height,
                    color: color
                }
            });
            // draw the background
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, maxWidth + 20, totalHeight);

            let currentOffset = 20;
            for (let i = 0; i < LogsWithTopOffset.length; i++) {
                const stringWithOffset = LogsWithTopOffset[i];
                // expect error because typescript doesn't know the first chr is a color and matches the object (and return grey if it doesn't)
                ///@ts-expect-error
                ctx.fillStyle = Colors[stringWithOffset.color] || "grey";
                ctx.textAlign = "start";
                ctx.textBaseline = "middle"
                ctx.fillText(stringWithOffset.text, 10, currentOffset);
                currentOffset += stringWithOffset.offset;
            }

        }
    }
    /**
     * render all active arrows
     * @param ctx the canvas's context
     * @param logs if logs (in top left conrner) should be rendered
     */
    static renderArrows(ctx: CanvasRenderingContext2D, logs = false) {
        Arrow.ActiveArrows.forEach(v => {
            v.draw(ctx);
        });
        if (logs) {
            this.renderLogs();
        }
    }
    /**
     * remove arrow from active arrow
     */
    remove() {
        if (Arrow.ActiveArrows.has(this)) {
            Arrow.ActiveArrows.delete(this);
        }
    }
    /**
     * add arrrow back to active arrow
     */
    addBack() {
        if (!Arrow.ActiveArrows.has(this)) {
            Arrow.ActiveArrows.add(this);
        }
    }
}

{
    function draw() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        Arrow.renderArrows(ctx, showLogs);

        // visuallizeBezierCurve(
        //     new Vector(0, 0),
        //     new Vector(0, 0),
        //     new Vector(0, 1),
        //     new Vector(0, 1.),
        //     2000,
        //     200
        // );

        requestAnimationFrame(draw);
    }
    draw();
}

/**
 * get the size (in pixel, real coordinates) of a chess Tile
 */
function getChessToRealCoordUnits() {
    const tileClienRect = chessDomMap[0][0].getBoundingClientRect();
    return new Vector(tileClienRect.width, tileClienRect.height);
}
/**
 * compute the real (in px) coordinate of a point in chess coordinates
 * @param chessCoord the coordinates, in chess coordinates
 * @param unit chess units (obtained with getChesToRealCoordUnits) to avoid computing them each time if they don't change
 */
function ChessToRealCoordinates(chessCoord: Vector, unit?: Vector): Vector {
    const _unit = unit === undefined ? getChessToRealCoordUnits() : unit;
    return chessCoord.add(1).multiply(_unit);
}

/**
 * visuallize a bezier curve with animation, meant for developpement to be put in a draw loop of a canvas
 * @param p1 bezier frist point
 * @param p2 bezier second point
 * @param p3 bezier thrid point
 * @param p4 bezier fourth point
 * @param period for the moving blue point how long does it takes to reach the end
 * @param resolution how many points drawn for the line
 */
function visuallizeBezierCurve(p1: Vector, p2: Vector, p3: Vector, p4: Vector, period: number, resolution: number) {
    try {
        const units = getChessToRealCoordUnits();

        const P1 = p1.substract(new Vector(0, 1)).multiply(new Vector(1, -1)).multiply(2).add(1).multiply(units);
        const P2 = p2.substract(new Vector(0, 1)).multiply(new Vector(1, -1)).multiply(2).add(1).multiply(units);
        const P3 = p3.substract(new Vector(0, 1)).multiply(new Vector(1, -1)).multiply(2).add(1).multiply(units);
        const P4 = p4.substract(new Vector(0, 1)).multiply(new Vector(1, -1)).multiply(2).add(1).multiply(units);

        const interp = (t: number) => bezierInterpolation(
            P1,
            P2,
            P3,
            P4,
            t,
            "point"
        );
        units.y = units.x;

        for (let i = 0; i < resolution; i++) {
            const point = interp(i / resolution);
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(point.x, point.y, units.x / 100, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();

            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(3 * units.x + (2 * units.x) / resolution * i, point.y, units.x / 100, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();

            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(5 * units.x + (2 * units.x) / resolution * i, -(point.x - (units.x * 4)), units.x / 100, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();

            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(7 * units.x + (2 * units.x) / resolution * i, -((P1.substract(point).length() / Math.hypot(2 * units.x, 2 * units.y) * (2 * units.x)) - 2 * units.y) + units.y, units.x / 100, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
        const t = new Date().getTime() % period;
        const bpoint = interp(t / period);
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(bpoint.x, bpoint.y, units.x / 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(3 * units.x + (2 * units.x) / period * t, bpoint.y, units.x / 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(5 * units.x + (2 * units.x) / period * t, -(bpoint.x - (units.x * 4)), units.x / 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(7 * units.x + (2 * units.x) / period * t, -((P1.substract(bpoint).length() / Math.hypot(2 * units.x, 2 * units.y) * (2 * units.x)) - 2 * units.y) + units.y, units.x / 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = "red";
        ctx.font = `${units.x / 3}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("curve", units.x * 2, units.y * 3.2);
        ctx.fillText("y coord", units.x * 4, units.y * 3.2);
        ctx.fillText("x coord", units.x * 6, units.y * 3.2);
        ctx.fillText("length", units.x * 8, units.y * 3.2);
    } catch (e) { };
}
