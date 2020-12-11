import crypto from 'crypto';
import path from 'path';

const PageCodeAllowedCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split('');
const PageCodeLength = 5;
/**
 * generate random page code
 * @param exclude code to exclude, will regenerate if it gets it (to avoid collision)
 */
function generatePageCode(exclude: string[] = []): string {
    let res = "";
    for (let i = 0; i < PageCodeLength; i++) {
        const chr = Math.floor(crypto.randomBytes(1)[0] / 256 * (PageCodeAllowedCharacters.length));
        res += PageCodeAllowedCharacters[chr];
    }
    const colliding = exclude.length > 0 ? exclude.map(col => col === res).reduce((o, v) => o || v) : false;
    return colliding ? generatePageCode(exclude) : res;
}

function verrifyPageCode(code: string, include: string[] = []) {
    return code.match(/^[0-9A-Za-z]*$/g) && code.length === PageCodeLength && (include.length > 0 ? include.map(v => v === code).reduce((o, v) => o || v) : true);
}

/**
 * convert a number from any base to any other base
 * @param numIn the number that will be converted (an array of number, each number is a digit, 26(B10) = [2, 6]; 101(B2) = [1, 0 ,1]; FA(B16) = [16, 11])
 * @param baseFrom the base the in number is in
 * @param baseOut the base to convert numIn to
 */
function convertBase(numIn: number[], baseFrom: number, baseOut: number) {
    return toDigits(fromDigits(numIn, baseFrom), baseOut);
}

function abs(absPath: string) {
    return path.join(__dirname, absPath);
}


function toDigits(n: number, b: number) {
    const digits: number[] = [];
    while (n > 0) {
        digits.push(0, n % b);
        n = Math.floor(n / b);
    }
    return digits;
}
function fromDigits(digits: number[], b: number) {
    let n = 0;
    for (let d of digits) {
        n = b * n + d;
    }
    return n;
}

export {
    convertBase,
    generatePageCode,
    abs,
    verrifyPageCode
}