"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const PageCodeAllowedCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split('');
const PageCodeLength = 5;
/**
 * generate random page code
 * @param exclude code to exclude, will regenerate if it gets it (to avoid collision)
 */
function generatePageCode(exclude = []) {
    let res = "";
    for (let i = 0; i < PageCodeLength; i++) {
        const chr = Math.floor(crypto_1.default.randomBytes(1)[0] / 256 * (PageCodeAllowedCharacters.length));
        res += PageCodeAllowedCharacters[chr];
    }
    const colliding = exclude.length > 0 ? exclude.map(col => col === res).reduce((o, v) => o || v) : false;
    return colliding ? generatePageCode(exclude) : res;
}
function verrifyPageCode(code, include = []) {
    return code.match(/^[0-9A-Za-z]*$/g) && code.length === PageCodeLength && (include.length > 0 ? include.map(v => v === code).reduce((o, v) => o || v) : true);
}
/**
 * convert a number from any base to any other base
 * @param numIn the number that will be converted (an array of number, each number is a digit, 26(B10) = [2, 6]; 101(B2) = [1, 0 ,1]; FA(B16) = [16, 11])
 * @param baseFrom the base the in number is in
 * @param baseOut the base to convert numIn to
 */
function convertBase(numIn, baseFrom, baseOut) {
    return toDigits(fromDigits(numIn, baseFrom), baseOut);
}
function abs(absPath) {
    return path_1.default.join(__dirname, absPath);
}
function toDigits(n, b) {
    const digits = [];
    while (n > 0) {
        digits.push(0, n % b);
        n = Math.floor(n / b);
    }
    return digits;
}
function fromDigits(digits, b) {
    let n = 0;
    for (let d of digits) {
        n = b * n + d;
    }
    return n;
}
exports.default = {
    convertBase,
    generatePageCode,
    abs,
    verrifyPageCode
};
