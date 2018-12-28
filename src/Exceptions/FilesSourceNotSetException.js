import Exception from './Exception';

/**
 * files source not set exception
*/
export default class FilesSourceNotSetException extends Exception {

    /**
     *@param {string} message - error message
    */
    constructor(message) {
        super(message, FilesSourceNotSetException);
    }
}