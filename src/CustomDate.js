import Util from './Util';

/**
 * extend the Date module and export
*/

Date.prototype.toString = function() {
    return `${this.getFullYear()}-${Util.padZeros(this.getMonth() + 1)}-${Util.padZeros(this.getDate())}`;
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