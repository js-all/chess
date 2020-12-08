"use strict";
function ranFloat(min, max) {
    return Math.random() * (max - min) + min;
}
function ranInt(min, max) {
    return Math.floor(ranFloat(min, max + 1));
}
function ranRgb(alpha = false) {
    if (alpha) {
        return `rgba(${ranFloat(0, 255)}, ${ranFloat(0, 255)}, ${ranFloat(0, 255)}, ${ranFloat(0, 1)})`;
    }
    else {
        return `rgb(${ranFloat(0, 255)}, ${ranFloat(0, 255)}, ${ranFloat(0, 255)})`;
    }
}
function bezierInterpolation(a1, a2, a3, a4, a5, a6 = "point") {
    const c = (n) => Math.pow(n, 3);
    const s = (n) => Math.pow(n, 2);
    let p1;
    let p2;
    let p3;
    let p4;
    let t;
    let output;
    if (Vector.isVector(a1)) {
        p1 = a1;
        p2 = a2;
        p3 = a3;
        p4 = a4;
        t = a5;
        output = a6;
    }
    else {
        a1 = a1;
        p1 = a1.points.p1;
        p2 = a1.points.p2;
        p3 = a1.points.p3;
        p4 = a1.points.p4;
        t = a2;
        output = a1.component;
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
