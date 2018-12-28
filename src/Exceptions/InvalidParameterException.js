import Exception from './Exception';

/**
 * invalid parameter exception
*/
export default class InvalidParameterException extends Exception {

    /**
     *@param {string} message - error message
    */
    constructor(message) {
        super(message, InvalidParameterException);
    }
}