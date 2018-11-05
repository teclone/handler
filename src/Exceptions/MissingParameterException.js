import Exception from './Exception';

/**
 * generic MissingParameterException
*/
export default class MissingParameterException extends Exception {
    /**
     *@param {string} message the error message
    */
    constructor(message) {
        super(message, MissingParameterException);
    }
}