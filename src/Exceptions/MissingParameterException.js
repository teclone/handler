import Exception from './Exception';

/**
 * missing parameter exception
*/
export default class MissingParameterException extends Exception {

    /**
     *@param {string} message - error message
    */
    constructor(message) {
        super(message, MissingParameterException);
    }
}