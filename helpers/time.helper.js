

//na zaklade zdroja: https://stackoverflow.com/a/9763769

function pad(ms, z) {
    z = z || 2;
    return ('00' + ms).slice(-z);
}

function msToTime(s) {


    let ms = s % 1000;
    s = (s - ms) / 1000;
    let secs = s % 60;
    s = (s - secs) / 60;
    let mins = s % 60;
    let hrs = (s - mins) / 60;

    return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
}

module.exports = {msToTime}