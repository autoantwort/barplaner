/* eslint-disable */
// see  https://de.wikipedia.org/wiki/Kölner_Phonetik

const convert = s => {
    if (s.length === 0) {
        return "";
    }
    s = s.toUpperCase();
    let code = '';
    let lastChar = ' ';
    for (let i = 0; i < s.length; ++i) {
        const c = s[i];
        const nextChar = i + 1 === s.length ? ' ' : s[i + 1];
        switch (c) {
            //umlaute
            case 'Ä':
            case 'Ö':
            case 'Ü':
                //Normal
            case 'A':
            case 'E':
            case 'I':
            case 'J':
            case 'O':
            case 'U':
            case 'Y':
                code += '0';
                break;
            case 'H':
                break;
            case 'B':
                code += '1';
                break;
            case 'F':
            case 'V':
            case 'W':
                code += '3';
                break;
            case 'G':
            case 'K':
            case 'Q':
                code += '4';
                break;
            case 'L':
                code += '5';
                break;
            case 'M':
            case 'N':
                code += '6';
                break;
            case 'R':
                code += '7';
                break;
            case 'ß':
            case 'S':
            case 'Z':
                code += '8';
                break;
            case 'P':
                if (nextChar == 'H') {
                    code += '3';
                } else {
                    code += '1';
                }
                break;
            case 'D':
            case 'T':
                {
                    switch (nextChar) {
                        case 'C':
                        case 'S':
                        case 'Z':
                            code += '8';
                            break;
                        default:
                            code += '2';
                            break;
                    }
                }
                break;
            case 'X':
                switch (lastChar) {
                    default: code += '4';
                    case 'C':
                            case 'K':
                            case 'Q':
                            code += '8';
                }
                break;
            case 'C':
                switch (lastChar) {
                    case ' ':
                        switch (nextChar) {
                            case 'A':
                            case 'H':
                            case 'K':
                            case 'L':
                            case 'O':
                            case 'Q':
                            case 'R':
                            case 'U':
                            case 'X':
                                code += '4';
                                break;
                            default:
                                code += '8';
                                break;

                        }
                        break;
                    case 'S':
                    case 'Z':
                        code += '8';
                        break;
                    default:
                        switch (nextChar) {
                            case 'A':
                            case 'H':
                            case 'K':
                            case 'O':
                            case 'Q':
                            case 'U':
                            case 'X':
                                code += '4';
                                break;
                            default:
                                code += '8';
                                break;
                        }
                        break;
                }
                break;
            default:
                // parse whole numbers
                if (c >= '0' && c <= '9') {
                    // wrap the number in ' so that we can ignore 
                    // numbers when removing zeros and duplicated numbers
                    code += "'";
                    // a number, e.g. 0,0% will be converted to #0.0%
                    code += '#';
                    code += c;
                    ++i;
                    while (i < s.length) {
                        const n = s[i];
                        if (n >= '0' && n <= '9') {
                            code += n;
                        } else if (n === ',' || n === '.') {
                            code += '.';
                        } else if (n === '%') {
                            code += '%';
                        } else {
                            code += "'";
                            --i;
                            break;
                        }
                        ++i;
                    }
                }
                // ignore all other chars
                code += ' ';
        }
    }

    let l = 0;
    let wasNull = false;
    let inString = false;
    let newCode = code[0];
    for (let i = 1; i < code.length; i++) {
        if (code[i] === "'") {
            inString = !inString;
        } else if (!inString) {
            if (code[i] === '0' && code[i - 1] !== ' ') {
                wasNull = true;
            } else if ((newCode[l] !== code[i]) || wasNull) {
                newCode += code[i];
                ++l;
                wasNull = false;
            }
        } else {
            newCode += code[i];
        }
    }
    return newCode;
};

module.exports.convert = convert;