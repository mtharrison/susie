exports.stringifyEvent = function (event) {

    var str = '';
    const endl = '\r\n';
    for (var i in event) {
        var val = event[i];
        if (typeof val === 'object') {
            val = JSON.stringify(val);
        }
        str += i + ': ' + val + endl;
    }
    str += endl;

    return str;
};
