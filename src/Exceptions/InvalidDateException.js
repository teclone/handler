import Exception from './Exception';

/**
 * invalid date exception
*/
export default class InvalidDateException extends Exception {

    /**
     *@param {string} message - error message
    */
    constructor(message) {
        super(message, InvalidDateException);
    }
}