"use strict";
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static get null() {
        return new Vector(0, 0);
    }
    negative() {
        return new Vector(-this.x, -this.y);
    }
    add(v) {
        if (v instanceof Vector)
            return new Vector(this.x + v.x, this.y + v.y);
        return new Vector(this.x + v, this.y + v);
    }
    substract(v) {
        if (v instanceof Vector)
            return new Vector(this.x - v.x, this.y - v.y);
        return new Vector(this.x - v, this.y - v);
    }
    multiply(v) {
        if (v instanceof Vector)
            return new Vector(this.x * v.x, this.y * v.y);
        return new Vector(this.x * v, this.y * v);
    }
    divide(v) {
        if (v instanceof Vector)
            return new Vector(this.x / v.x, this.y / v.y);
        return new Vector(this.x / v, this.y / v);
    }
    equals(v) {
        return this.x == v.x && this.y === v.y;
    }
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    clamp(n = 4) {
        const f = (nu) => parseFloat(nu.toFixed(n));
        return new Vector(f(this.x), f(this.y));
    }
    setLength(length) {
        if (this.equals(new Vector(0, 0)))
            return Vector.fromAngle(0, length);
        return Vector.fromAngle(this.toAngle(), length);
    }
    length() {
        return Math.sqrt(this.dot(this));
    }
    unit() {
        return this.divide(this.length());
    }
    min() {
        return Math.min(this.x, this.y);
    }
    max() {
        return Math.max(this.x, this.y);
    }
    toAngle() {
        if (this.x === 0 && this.y === 0)
            return 0;
        return Math.atan2(this.unit().y, this.unit().x);
    }
    angleTo(a) {
        return Math.acos(this.dot(a) / (this.length() * a.length()));
    }
    toArray() {
        return [this.x, this.y];
    }
    toString() {
        return `[${this.x}, ${this.y}]`;
    }
    clone() {
        return new Vector(this.x, this.y);
    }
    set(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }
    static lerp(v1, v2, factor) {
        return v1.add(v2.substract(v1).multiply(factor));
    }
    static isVector(vec) {
        return vec instanceof Vector;
    }
    init(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    perpendicular(CCW = false) {
        return CCW ? new Vector(-this.y, this.x) : new Vector(this.y, -this.x);
    }
    normal() {
        return new Vector(this.y, -this.x);
    }
    floor() {
        return new Vector(Math.floor(this.x), Math.floor(this.y));
    }
    reverse() {
        return new Vector(this.y, this.x);
    }
    map(func) {
        return new Vector(func(this.x, this), func(this.y, this));
    }
    static fromAngle(angle = 0, length = 1) {
        return new Vector(Math.cos(angle) * length, Math.sin(angle) * length);
    }
    static randomDirrection(length) {
        const l = length === null ? Math.random() * Number.MAX_VALUE / 100000 : length;
        if (length === null)
            return Vector.fromAngle(Math.random() * (Math.PI * 2), l);
    }
    static fromObject(obj) {
        return new Vector(obj.x, obj.y);
    }
    static cross(a, b) {
        if (typeof a === "number" && b instanceof Vector) {
            return new Vector(-a * b.y, a * b.x);
        }
        else if (a instanceof Vector && typeof b === "number") {
            return new Vector(b * a.y, b * a.x);
        }
        else if (a instanceof Vector && b instanceof Vector) {
            return a.x * b.y - a.y * b.x;
        }
        else {
            throw new TypeError('you can\'t use 2 numbers in this method');
        }
    }
    static fromArray(array) {
        return new Vector(...array);
    }
}
