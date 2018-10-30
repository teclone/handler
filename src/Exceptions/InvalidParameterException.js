import Exception from './Exception';

/**
 * generic InvalidParameterException
*/
export default class InvalidParameterException extends Exception {
    /**
     *@param {string} message the error message
    */
    constructor(message) {
        super(message, InvalidParameterException);
    }
}