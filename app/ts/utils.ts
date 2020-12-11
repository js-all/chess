import Vector from './Vector';

function ranFloat(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function ranInt(min: number, max: number) {
    return Math.floor(ranFloat(min, max + 1));
}

function ranRgb(alpha = false) {
    if (alpha) {
        return `rgba(${ranFloat(0, 255)}, ${ranFloat(0, 255)}, ${ranFloat(0, 255)}, ${ranFloat(0, 1)})`;
    } else {
        return `rgb(${ranFloat(0, 255)}, ${ranFloat(0, 255)}, ${ranFloat(0, 255)})`;
    }
}

function bezierInterpolation(bezierData: BezierCurveDataPoint, t: number): Vector
function bezierInterpolation(bezierData: BezierCurveDataYCoord, t: number): number
function bezierInterpolation(bezierData: BezierCurveDataXCoord, t: number): number
function bezierInterpolation(bezierData: BezierCurveDataLength, t: number): number
function bezierInterpolation(p1: Vector, p2: Vector, p3: Vector, p4: Vector, t: number, output: "point"): Vector
function bezierInterpolation(p1: Vector, p2: Vector, p3: Vector, p4: Vector, t: number, output: "y coordinate"): number
function bezierInterpolation(p1: Vector, p2: Vector, p3: Vector, p4: Vector, t: number, output: "x coordinate"): number
function bezierInterpolation(p1: Vector, p2: Vector, p3: Vector, p4: Vector, t: number, output: "length from start"): number
function bezierInterpolation(a1: Vector | BezierCurveData, a2: Vector | number, a3?: Vector, a4?: Vector, a5?: number, a6: BezierOutput = "point"): Vector | number {
    const c = (n: number) => Math.pow(n, 3);
    const s = (n: number) => Math.pow(n, 2);

    let p1: Vector;
    let p2: Vector;
    let p3: Vector;
    let p4: Vector;
    let t: number;
    let output: BezierOutput;

    if (Vector.isVector(a1)) {
        p1 = a1 as Vector;
        p2 = a2 as Vector;
        p3 = a3 as Vector;
        p4 = a4 as Vector;
        t = a5 as number;
        output = a6 as BezierOutput;
    } else {
        a1 = a1 as BezierCurveData;
        p1 = a1.points.p1;
        p2 = a1.points.p2;
        p3 = a1.points.p3;
        p4 = a1.points.p4;
        t = a2 as number;
        output = a1.component as BezierOutput;
    }

    // QUICC MATFS
    const point = p1.multiply(c(1 - t)).add(p2.multiply(3 * s(1 - t) * t)).add(p3.multiply(3 * (1 - t) * s(t))).add(p4.multiply(c(t)));
    switch (output) {
        case "point":
            return point;
        case "x coordinate":
            return point.x;
        case "y coordinate":
            return point.y;
        case "length from start":
            return p1.substract(point).length();
    }

}

export {
    bezierInterpolation,
    ranFloat,
    ranInt,
    ranRgb
}