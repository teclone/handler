import Exception from './Exception';

/**
 * generic FileReadException
*/
export default class FileReadException extends Exception {
    /**
     *@param {string} message the error message
    */
    constructor(message) {
        super(message, FileReadException);
    }
}