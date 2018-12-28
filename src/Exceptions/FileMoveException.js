import Exception from './Exception';

/**
 * file move exception
*/
export default class FileMoveException extends Exception {

    /**
     *@param {string} message - error message
    */
    constructor(message) {
        super(message, FileMoveException);
    }
}