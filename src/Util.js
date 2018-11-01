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

    /**
     * returns the argument if it is already an array, or makes an array using the argument
     *@param {*} arg - the argument
     *@param {boolean} excludeNulls - boolean value indicating if null argument should default
     * to empty array just like undefined argument
     *@returns {Array}
    */
    makeArray(arg, excludeNulls) {
        if (this.isArray(arg))
            return arg;
        return this.isValidParameter(arg, excludeNulls)? [arg] : [];
    },

    /**
     * returns the value for the first key in the keys array that exists in the object
     * otherwise, return the default value
     *
     *@param {string[]|string} keys - array of keys or a single string key
     *@param {Object} object - the object
     *@param {mixed} [defaultValue=undefined] - the default value to return if otherwise.
     * defaults to undefined
     *@return mixed
    */
    value(keys, object, defaultValue) {
        keys = this.makeArray(keys);

        if (this.isPlainObject(object)) {
            for (let key of keys) {
                if (this.isString(key) && typeof object[key] !== 'undefined')
                    return object[key];
            }
        }
        return defaultValue;
    },

    /**
     * returns the first object value for a key in the keys array that exists in the object
     * otherwise, return the default value
     *
     *@param {string[]|string} keys - array of keys or a single string key
     *@param {Object} object - the object
     *@param {mixed} [defaultValue={}] - the default value to return if otherwise.
     * defaults to empty object
     *@return mixed
    */
    objectValue(keys, object, defaultValue) {

        keys = this.makeArray(keys);
        defaultValue = this.isPlainObject(defaultValue)? defaultValue : {};

        if (this.isPlainObject(object)) {
            for (let key of keys) {
                if (this.isString(key) && typeof object[key] !== 'undefined') {
                    let value = object[key];
                    if (this.isPlainObject(value))
                        return value;
                }
            }
        }
        return defaultValue;
    },

    /**
     * returns the first array value for a key in the keys array that exists in the object
     * otherwise, return the default value
     *
     *@param {string[]|string} keys - array of keys or a single string key
     *@param {Object} object - the object
     *@param {mixed} [defaultValue=[]] - the default value to return if otherwise.
     * defaults to empty array
     *@return mixed
    */
    arrayValue(keys, object, defaultValue) {

        keys = this.makeArray(keys);
        defaultValue = this.isArray(defaultValue)? defaultValue : [];

        if (this.isPlainObject(object)) {
            for (let key of keys) {
                if (this.isString(key) && typeof object[key] !== 'undefined') {
                    let value = object[key];
                    if (this.isArray(value))
                        return value;
                }
            }
        }
        return defaultValue;
    },

    /**
     * deletes the given keys from the object if they exists
     *@param {string[]|string} keys - array of keys or a single string key
     *@param {Object} object - the object
    */
    deleteFromObject(keys, object) {
        keys = this.makeArray(keys);
        if (this.isPlainObject(object)) {
            keys.forEach((key) => {
                object[key] = null;
                delete object[key];
            });
        }
    },

    /**
     * returns true if the key is not defined in the object, or if it is defined and truthy
     * it returns false if argument two is not an object
     *@param {string} key - string key
     *@param {Object} object - the object
    */
    keyNotSetOrTrue(key, object) {
        if (this.isPlainObject(object)) {
            return typeof object[key] === 'undefined' || !!(object[key]);
        }
        return false;
    },

    /**
     * returns true if the given key is defined in the object and its value is truthy
     *@param {string} key - string key
     *@param {Object} object - the object
    */
    keySetAndTrue(key, object) {
        if(this.isPlainObject(object) && !!object[key]) {
            return true;
        }
        return false;
    },

    /**
     * creates a range of value
     *@param {number|string} from - number to start from or alphabet to start with
     *@param {number|string} to - number to end at or alphabet to end at
     *@param {number} [step=1] - step count to apply
     *@returns {Array}
    */
    range(from, to, step) {

        if (from === null || from === undefined || to === null || to === undefined)
            return [];

        from =  from.toString();
        to = to.toString();

        step = this.isNumeric(step)? (parseFloat(step) || 1) : 1;

        const result = [],
            letters = 'abcdefghijklmnopqrstuvwxyz',
            lowerCaseFrom = from.toLowerCase();

        if (this.isNumeric(from)) {

            from = parseFloat(from);
            to = parseFloat(to);

            for(from; from <= to; from += step)
                result.push(from);
        }
        else if (from.length === 1 && letters.indexOf(lowerCaseFrom) > -1) {
            let start = letters.indexOf(lowerCaseFrom),
                end = letters.indexOf(to.toLowerCase());

            if (end < 0)
                end = 25;

            let target = (from === lowerCaseFrom? letters : letters.toUpperCase()).split('');
            for(start; start <= end; start += step)
                result.push(target[start]);
        }
        return result;
    },

    /**
     * pads zeros to the left of the argument until it meets the required length
     *@param {string|number} value - the value to be padded
     *@param {number} [finalLength=2] - expected final length of value
     *@return {string}
    */
    padZeros(value, finalLength) {
        if (!this.isString(value) && typeof value !== 'number')
            return '';

        value = value.toString();
        const len = value.length;

        finalLength = this.isInt(finalLength)? Math.abs(finalLength) : 2;
        let diff = finalLength - len;

        while (--diff >= 0)
            value = '0' + value;

        return value;
    }
};