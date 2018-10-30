import Regex from '../Regex';
import Util from '../Util';

export default class {

    constructor(errorBag) {
        /* object of error bag containing all errors detected since the instance creation */
        if (!Util.isPlainObject(errorBag))
            errorBag = {};

        /* boolean property indicating if the last check succeeded */
        this._succeeds = true;

        /* current field under validation */
        this._field = '';

        /* current field check options */
        this._options = {};

        /* the current field value index */
        this._index = 0;

        /* boolean value indication if the validation should proceed */
        this._shouldProceed = true;

        this.setErrorBag(errorBag);
    }

    /**
     * resets the instance
     *
     *@param {string} field - the next field to process
     *@param {Object} options - validation object
     *@param {integer} [index=0] - the current field value index
     *@returns {this}
    */
    reset(field, options, index) {

        this._field = field;
        this._options = options;
        this._index = Util.isInt(index)? parseInt(index) : 0;

        this._shouldProceed = true;
        this._succeeds = true;

        return this;
    }

    /**
     * returns the should proceed status
     *@returns {boolean}
    */
    shouldProceed(status) {
        if (status !== undefined)
            this._shouldProceed = status? true : false;

        return this._shouldProceed;
    }

    /**
     * sets the given error message
     *@param {string} err - the error message
     *@param {mixed} value - the current field value under validation
     *@returns {boolean} returns false
    */
    setError(err, value) {
        if(Util.isNumeric(value))
            value = `"${value}"`;

        this._errorBag[this._field] = Regex.replaceCallback(
            /\{([^}]+)\}/, (matches) => {
                switch(matches[1].toLowerCase()) {
                    case 'this':
                        return value;

                    case '_this':
                        return this._field;

                    case '_index':
                        return this._index + 1;
                }
            }, err);

        this._succeeds = false;
        return false;
    }

    /**
     * sets the error bag
     *
     *@param {Object} errorBag - the error bag
    */
    setErrorBag(errorBag) {
        if (Util.isPlainObject(errorBag))
            this._errorBag = errorBag;
    }

    /**
     * the error bag
     *@type {Object}
    */
    getErrorBag() {
        return this._errorBag;
    }

    /**
     * returns the error message for the given key, if key is not given, it returns any
     * error message in the error bag
     *
     * it returns undefined if there are no errors or if there is no error for the given key.
     *@param {string} [field] - the field to return its error message
     *@param {string} [defaultValue=undefined] - default value to return. defaults to undefined
     *@returns {string|undefined}
    */
    getError(field) {
        const errorKeys = Object.keys(this._errorBag);
        if (errorKeys.length > 0) {
            //if the field is given, return the value else, return undefined
            if (typeof field === 'string')
                return Util.value(field, this._errorBag);

            //return the first error
            return this._errorBag[errorKeys[0]];
        }
        return undefined;
    }

    /**
     * tells if the last validation succeeded or not
     *@returns {boolean}
    */
    succeeds() {
        return this._succeeds;
    }

    /**
     * tells if the last validation failed or not
     *@returns {boolean}
    */
    fails() {
        return !this.succeeds();
    }
}