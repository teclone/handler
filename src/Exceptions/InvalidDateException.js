import Exception from './Exception';

/**
 * generic InvalidDateException
*/
export default class InvalidDateException extends Exception {
    /**
     *@param {string} message the error message
    */
    constructor(message) {
        super(message, InvalidDateException);
    }
}