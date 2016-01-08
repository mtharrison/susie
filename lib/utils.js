'use strict';

exports.stringifyEvent = function (event) {

    let str = '';
    const endl = '\r\n';
    for (const i in event) {
        let val = event[i];
        if (val instanceof Buffer) {
            val = val.toString();
        }
        if (typeof val === 'object') {
            val = JSON.stringify(val);
        }
        str += i + ': ' + val + endl;
    }
    str += endl;

    return str;
};
