import Exception from './Exception';

/**
 * generic FileSourceNotSetException
*/
export default class FilesSourceNotSetException extends Exception {
    /**
     *@param {string} message the error message
    */
    constructor(message) {
        super(message, FilesSourceNotSetException);
    }
}