// parse query options 
function parseObject(value, name) {
    if (value === undefined) return undefined;
    var parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(name + ' must be a JSON object');
    }
    return parsed;
}

function parseNumber(value, name, defaultValue) {
    if (value === undefined) return defaultValue;
    var number = Number(value);
    if (!Number.isInteger(number) || number < 0) {
        throw new Error(name + ' must be a non-negative integer');
    }
    return number;
}

function isTrue(value) {
    return value === true || value === 'true';
}

module.exports = {
    parseObject: parseObject,
    parseNumber: parseNumber,
    isTrue: isTrue
};
