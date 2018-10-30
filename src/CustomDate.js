/**
 * extend the Date module and export
*/

Date.prototype.toString = function() {
    return '' + this.getFullYear() + '-' + this.getMonth() + '-' + this.getDay();
};

/**
 * validates if the given date is valid
 *
 *@return {boolean}
*/
Date.isValid = function(year, month, day) {
    year = parseInt(year);
    month = parseInt(month);
    day = parseInt(day);

    let instance = new Date(year, month, day);

    if (instance.getFullYear() === year && instance.getMonth() === month && instance.getDate() === day) {
        return true;
    }

    return false;
};

export default Date;