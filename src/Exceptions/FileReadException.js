import Exception from './Exception';

/**
 * file read exception
*/
export default class FileReadException extends Exception {

    /**
     *@param {string} message - error message
    */
    constructor(message) {
        super(message, FileReadException);
    }
}