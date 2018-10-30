/**
 * Utility module. contains loads of utility methods
*/
const toString = Object.prototype.toString;
export default {

    /**
     * tests if a variable is a string
     *@param {*} variable - variable to test
     *@returns {boolean}
    */
    isString(variable) {
        return typeof variable === 'string';
    },

    /**
     * tests if a variable is an integer
     *@param {mixed} variable - variable to test
     *@return {boolean}
    */
    isInt(variable) {
        return /^[-+]?\d+/.test(variable);
    },

    /**
     * tests if a variable is numeric
     *@param {mixed} variable - variable to test
     *@return {boolean}
    */
    isNumeric(variable) {
        return /^[-+.]?\d+/.test(variable);
    },

    /**
     * tests if a variable is an array
     *@param {*} variable - variable to test
     *@returns {boolean}
    */
    isArray(variable) {
        return toString.call(variable) === '[object Array]' || variable instanceof Array;
    },

    /**
     * tests if a variable is a function
     *@param {*} variable - variable to test
     *@returns {boolean}
    */
    isCallable(variable) {
        return (toString.call(variable) === '[object Function]' || variable instanceof Function) && !(variable instanceof RegExp);
    },

    /**
     * tests if a variable is a regex expression
     *@param {*} variable - variable to test
     *@returns {boolean}
    */
    isRegex(variable) {
        return (toString.call(variable) === '[object RegExp]' && variable instanceof RegExp);
    },

    /**
     * tests if a variable is an object
     *@param {*} variable - variable to test
     *@returns {boolean}
    */
    isObject(variable) {
        return typeof variable === 'object' && variable !== null;
    },

    /**
     * tests if a variable is a plain object literal
     *@param {*} variable - variable to test
     *@returns {boolean}
    */
    isPlainObject(variable) {
        if (this.isObject(variable)) {
            let prototypeOf = Object.getPrototypeOf(variable);
            return prototypeOf === null || prototypeOf === Object.getPrototypeOf({});
        }
        return false;
    },

    /**
     * tests if a variable is a valid function parameter
     *@param {*} variable - variable to test
     *@param {boolean} excludeNulls - boolean value indicating if null values should be
     * taken as an invalid parameter
     *@returns {boolean}
    */
    isValidParameter(variable, excludeNulls) {
        if (excludeNulls && variable === null)
            return false;
        return typeof variable !== 'undefined';
    },
};