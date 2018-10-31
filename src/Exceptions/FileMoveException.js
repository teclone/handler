import Exception from './Exception';

/**
 * generic FileMoveException
*/
export default class FileMoveException extends Exception {
    /**
     *@param {string} message the error message
    */
    constructor(message) {
        super(message, FileMoveException);
    }
}